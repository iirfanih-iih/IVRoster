// ══════════════════════════════════════
// SUPABASE CONFIG
// Get these from: Supabase Dashboard → Settings → API
// ══════════════════════════════════════
// TODO: Replace with your actual Supabase project values
const SUPABASE_URL = 'https://pvopusxiipswhcjlspfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b3B1c3hpaXBzd2hjamxzcGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTEwMDcsImV4cCI6MjA5NDQ2NzAwN30.rfob3VgKdfwNKWiVi5YfEkUvS6iTvW4nWtVTPaOmGrk';

// Initialize Supabase client
let _supabase = null;
let _realtimePaused = false;
let _realtimeChannels = [];

function initSupabase(){
  try {
    const supaLib = window.supabase || window.Supabase;
    if(supaLib && supaLib.createClient){
      _supabase = supaLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase client initialised ✓');
      return true;
    }
    return false;
  } catch(e){ console.error('Supabase init failed:', e); return false; }
}
if(!initSupabase()){
  document.addEventListener('DOMContentLoaded', () => {
    if(!_supabase){
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@supabase/supabase-js@2';
      s.onload = () => initSupabase();
      document.head.appendChild(s);
    }
  });
}

// Sync status indicator
function setSyncStatus(state){
  let el = document.getElementById('syncDot');
  if(!el){
    el = document.createElement('div');
    el.id = 'syncDot';
    el.style.cssText = 'position:fixed;bottom:12px;right:12px;width:10px;height:10px;border-radius:50%;z-index:999;transition:background .3s;cursor:help;';
    document.body.appendChild(el);
  }
  const states = {ok:{bg:'#00C853',t:'Synced'},saving:{bg:'#FFC107',t:'Saving…'},error:{bg:'#f44336',t:'Sync error'},off:{bg:'#555',t:'Offline mode'}};
  const s = states[state]||states.off;
  el.style.background = s.bg;
  el.title = s.t;
}

function pauseRealtime(ms){ _realtimePaused=true; setTimeout(()=>{_realtimePaused=false;},ms); }

// ══════════════════════════════════════
// AUTH HELPERS
// ══════════════════════════════════════
async function getSession() {
  if(!_supabase) return null;
  const { data: { session } } = await _supabase.auth.getSession();
  return session;
}

async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await _supabase.from('profiles').select('*').eq('id', session.user.id).single();
  return data;
}

async function signIn(email, password) {
  if(!_supabase) throw new Error('Database not connected');
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  if(_supabase) await _supabase.auth.signOut();
  stopRealtime();
  window.location.href = 'index.html';
}

// ══════════════════════════════════════
// DB HELPERS
// ══════════════════════════════════════
async function dbLoadRosters(team) {
  if(!_supabase){ setSyncStatus('off'); return []; }
  setSyncStatus('saving');
  const { data, error } = await _supabase.from('rosters').select('*').eq('team', team);
  if(error){ setSyncStatus('error'); console.error(error); return []; }
  setSyncStatus('ok');
  return data || [];
}

async function dbSaveRoster(team, eventId, roster, confirmed) {
  if(!_supabase){ setSyncStatus('off'); return; }
  pauseRealtime(2000);
  setSyncStatus('saving');
  const session = await getSession();
  const { error } = await _supabase.from('rosters').upsert({
    team, event_id: eventId, roster, confirmed,
    updated_by: session?.user?.id,
    updated_at: new Date().toISOString()
  }, { onConflict: 'team,event_id' });
  if(error){ setSyncStatus('error'); console.error(error); }
  else setSyncStatus('ok');
}

async function dbLoadOverrides(team) {
  if(!_supabase) return [];
  const { data } = await _supabase.from('manual_overrides').select('*').eq('team', team);
  return data || [];
}

async function dbSaveOverride(team, eventId, overrides) {
  if(!_supabase) return;
  pauseRealtime(2000);
  await _supabase.from('manual_overrides').upsert({
    team, event_id: eventId, overrides
  }, { onConflict: 'team,event_id' });
}

// ══════════════════════════════════════
// REALTIME SUBSCRIPTIONS
// ══════════════════════════════════════
function startRealtime(team, onRosterChange){
  if(!_supabase) return;
  stopRealtime();
  const ch = _supabase.channel('realtime-rosters-'+team)
    .on('postgres_changes',{event:'*',schema:'public',table:'rosters',filter:'team=eq.'+team}, payload=>{
      if(_realtimePaused) return;
      console.log('Realtime roster update:', payload.eventType);
      if(onRosterChange) onRosterChange(payload);
    })
    .subscribe(s=>{ if(s==='SUBSCRIBED') console.log('Realtime: rosters ('+team+') ✓'); });
  _realtimeChannels.push(ch);
}

function stopRealtime(){
  _realtimeChannels.forEach(ch=>{ try{_supabase.removeChannel(ch);}catch(e){} });
  _realtimeChannels=[];
}


// ══════════════════════════════════════
// MEMBER STATE PERSISTENCE
// ══════════════════════════════════════
async function dbSaveMemberState(team, memberState) {
  if(!_supabase || SUPABASE_URL.includes('YOUR_PROJECT')) return;
  pauseRealtime(2000);
  setSyncStatus('saving');
  try {
    const { error } = await _supabase.from('app_settings').upsert({
      key: 'member_state_' + team,
      value: JSON.stringify(memberState),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
    if (error) throw error;
    setSyncStatus('ok');
  } catch(e) { console.error('Member state save failed:', e); setSyncStatus('error'); }
}

async function dbLoadMemberState(team) {
  if(!_supabase || SUPABASE_URL.includes('YOUR_PROJECT')) return null;
  try {
    const { data, error } = await _supabase.from('app_settings').select('value').eq('key', 'member_state_' + team).maybeSingle();
    if (error || !data) return null;
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
  } catch(e) { return null; }
}


// ══════════════════════════════════════
// AUDIT LOGGING
// ══════════════════════════════════════
let _clientIP = '';
// Fetch public IP on load
fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>{_clientIP=d.ip||'';}).catch(()=>{});

async function auditLog(action, category, detail) {
  const entry = {
    ts: new Date().toISOString(),
    username: window._currentUserEmail || 'unknown',
    user_display: window._currentUserName || 'Unknown',
    action: action || '',
    category: category || '',
    detail: detail || '',
    ip: _clientIP || ''
  };
  if (_supabase && !SUPABASE_URL.includes('YOUR_PROJECT')) {
    try {
      await _supabase.from('audit_logs').insert(entry);
    } catch(e) { console.warn('Audit log failed:', e); }
  }
  console.log('AUDIT:', entry.action, entry.detail, entry.ip);
}
