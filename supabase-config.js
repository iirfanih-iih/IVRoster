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
async function dbLoadRosters(team, priorityEventIds) {
  if(!_supabase){ setSyncStatus('off'); return []; }
  setSyncStatus('saving');
  // If priority IDs provided, load those first for fast render
  if(priorityEventIds && priorityEventIds.length){
    const { data: priority } = await _supabase.from('rosters').select('*').eq('team', team).in('event_id', priorityEventIds);
    // Load rest in background
    _supabase.from('rosters').select('*').eq('team', team).then(({data:all})=>{
      if(all && window._onFullRostersLoaded) window._onFullRostersLoaded(all);
    });
    setSyncStatus('ok');
    return priority || [];
  }
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


// ══════════════════════════════════════
// EMAIL NOTIFICATIONS (critical actions)
// ══════════════════════════════════════
const CRITICAL_ACTIONS = ['Login', 'User created', 'Password reset', 'Roster confirmed', 'Event cleared', 'Leadership contacts updated'];

async function sendNotification(subject, body, category) {
  if (!_supabase || SUPABASE_URL.includes('YOUR_PROJECT')) return;
  try {
    const session = await getSession();
    await fetch(SUPABASE_URL + '/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (session ? session.access_token : '')
      },
      body: JSON.stringify({ subject, body, category })
    });
  } catch(e) { console.warn('Notification failed:', e); }
}

// Patch auditLog to send email on critical actions
const _originalAuditLog = auditLog;
auditLog = async function(action, category, detail) {
  await _originalAuditLog(action, category, detail);
  if (CRITICAL_ACTIONS.some(a => action.includes(a))) {
    const user = window._currentUserName || window._currentUserEmail || 'Unknown';
    sendNotification(
      action,
      `<strong>User:</strong> ${user}<br><strong>Action:</strong> ${action}<br><strong>Details:</strong> ${detail || 'N/A'}<br><strong>Time:</strong> ${new Date().toLocaleString('en-NZ')}<br><strong>IP:</strong> ${_clientIP || 'Unknown'}`,
      category
    );
  }
};

// ══════════════════════════════════════
// RATE LIMITING
// ══════════════════════════════════════
const _rateLimits = {};
function isRateLimited(action, maxPerMinute) {
  const now = Date.now();
  if (!_rateLimits[action]) _rateLimits[action] = [];
  _rateLimits[action] = _rateLimits[action].filter(t => now - t < 60000);
  if (_rateLimits[action].length >= maxPerMinute) return true;
  _rateLimits[action].push(now);
  return false;
}

// ══════════════════════════════════════
// PASSWORD COMPLEXITY
// ══════════════════════════════════════
function validatePassword(pw) {
  const errors = [];
  if (pw.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(pw)) errors.push('At least 1 uppercase letter');
  if (!/[0-9]/.test(pw)) errors.push('At least 1 number');
  if (!/[!@#$%^&*()_+\-=\[\]{};:,.<>?]/.test(pw)) errors.push('At least 1 special character');
  return errors;
}

// ══════════════════════════════════════
// FORCE PASSWORD CHANGE ON NEXT LOGIN
// ══════════════════════════════════════
async function checkForcePasswordChange() {
  if (!_supabase || SUPABASE_URL.includes('YOUR_PROJECT')) return;
  try {
    const session = await getSession();
    if (!session) return;
    const { data } = await _supabase.from('app_settings').select('value').eq('key', 'force_pw_change_' + session.user.id).maybeSingle();
    if (data && data.value === 'true') {
      const newPw = await ivPrompt('You are required to change your password.\n\nRequirements:\n- At least 8 characters\n- 1 uppercase letter\n- 1 number\n- 1 special character (!@#$%^&*)\n\nEnter new password:');
      if (!newPw) { await signOut(); return; }
      const errors = validatePassword(newPw);
      if (errors.length) { alert('Password does not meet requirements:\n- ' + errors.join('\n- ')); await signOut(); return; }
      // Update password
      const { error } = await _supabase.auth.updateUser({ password: newPw });
      if (error) { alert('Failed to update password: ' + error.message); await signOut(); return; }
      // Remove force flag
      await _supabase.from('app_settings').delete().eq('key', 'force_pw_change_' + session.user.id);
      alert('Password updated successfully! You will now be signed out. Please log in with your new password.');await signOut();
    }
  } catch(e) { console.warn('Force PW check failed:', e); }
}


// ══════════════════════════════════════
// CUSTOM PROMPT (replaces browser prompt)
// Shows "IV Roster" instead of domain name
// ══════════════════════════════════════
function ivPrompt(message, defaultVal) {
  return new Promise(resolve => {
    let overlay = document.getElementById('ivPromptOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ivPromptOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = '<div style="background:#071628;border:1px solid rgba(79,195,247,0.18);border-radius:14px;padding:28px;width:400px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.5);"><div style="font-family:Barlow,sans-serif;font-size:14px;font-weight:800;color:#4FC3F7;margin-bottom:14px;">IV Roster</div><div id="ivPromptMsg" style="font-size:12px;color:#E8F4FD;line-height:1.6;margin-bottom:14px;white-space:pre-wrap;"></div><input id="ivPromptInput" type="text" style="width:100%;background:#0D2040;border:1px solid rgba(79,195,247,0.18);border-radius:8px;padding:10px 14px;color:#E8F4FD;font-size:13px;font-family:Lexend,sans-serif;outline:none;margin-bottom:14px;"><div style="display:flex;gap:8px;justify-content:flex-end;"><button id="ivPromptCancel" style="background:none;border:1px solid rgba(79,195,247,0.18);border-radius:8px;padding:8px 16px;font-size:12px;color:#7AAECB;cursor:pointer;font-family:Lexend,sans-serif;">Cancel</button><button id="ivPromptOk" style="background:linear-gradient(135deg,#0C2461,#1976D2);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:Lexend,sans-serif;">OK</button></div></div>';
      document.body.appendChild(overlay);
    }
    document.getElementById('ivPromptMsg').textContent = message;
    const input = document.getElementById('ivPromptInput');
    input.value = defaultVal || '';
    input.type = message.toLowerCase().includes('password') ? 'password' : 'text';
    overlay.style.display = 'flex';
    input.focus();
    const cleanup = (val) => { overlay.style.display = 'none'; resolve(val); };
    document.getElementById('ivPromptOk').onclick = () => cleanup(input.value);
    document.getElementById('ivPromptCancel').onclick = () => cleanup(null);
    input.onkeydown = (e) => { if (e.key === 'Enter') cleanup(input.value); if (e.key === 'Escape') cleanup(null); };
  });
}
// Override native prompt
window._nativePrompt = window.prompt;
window.prompt = function(msg, def) {
  // For sync contexts that can't await, fall back to native
  // But most of our code is async so ivPrompt is preferred
  return window._nativePrompt(msg, def);
};


// Custom alert (shows "IV Roster" instead of domain)
function ivAlert(message) {
  return new Promise(resolve => {
    let overlay = document.getElementById('ivAlertOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ivAlertOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = '<div style="background:#071628;border:1px solid rgba(79,195,247,0.18);border-radius:14px;padding:28px;width:400px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.5);"><div style="font-family:Barlow,sans-serif;font-size:14px;font-weight:800;color:#4FC3F7;margin-bottom:14px;">IV Roster</div><div id="ivAlertMsg" style="font-size:12px;color:#E8F4FD;line-height:1.6;margin-bottom:18px;white-space:pre-wrap;"></div><div style="text-align:right;"><button id="ivAlertOk" style="background:linear-gradient(135deg,#0C2461,#1976D2);color:#fff;border:none;border-radius:8px;padding:8px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:Lexend,sans-serif;">OK</button></div></div>';
      document.body.appendChild(overlay);
    }
    document.getElementById('ivAlertMsg').textContent = message;
    overlay.style.display = 'flex';
    const btn = document.getElementById('ivAlertOk');
    btn.focus();
    btn.onclick = () => { overlay.style.display = 'none'; resolve(); };
  });
}
// Override native alert
window._nativeAlert = window.alert;
window.alert = function(msg) { ivAlert(msg); };
