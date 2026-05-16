// ══════════════════════════════════════
// SUPABASE CONFIG
// Get these from: Supabase Dashboard → Settings → API
// ══════════════════════════════════════
// TODO: Replace with your actual Supabase project values
const SUPABASE_URL = 'https://pvopusxiipswhcjlspfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b3B1c3hpaXBzd2hjamxzcGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTEwMDcsImV4cCI6MjA5NDQ2NzAwN30.rfob3VgKdfwNKWiVi5YfEkUvS6iTvW4nWtVTPaOmGrk';

// Initialize Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ══════════════════════════════════════
// AUTH HELPERS
// ══════════════════════════════════════
async function getSession() {
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
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  await _supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ══════════════════════════════════════
// DB HELPERS
// ══════════════════════════════════════
async function dbLoadRosters(team) {
  const { data } = await _supabase.from('rosters').select('*').eq('team', team);
  return data || [];
}

async function dbSaveRoster(team, eventId, roster, confirmed) {
  const session = await getSession();
  await _supabase.from('rosters').upsert({
    team, event_id: eventId, roster, confirmed,
    updated_by: session?.user?.id,
    updated_at: new Date().toISOString()
  }, { onConflict: 'team,event_id' });
}

async function dbLoadOverrides(team) {
  const { data } = await _supabase.from('manual_overrides').select('*').eq('team', team);
  return data || [];
}

async function dbSaveOverride(team, eventId, overrides) {
  await _supabase.from('manual_overrides').upsert({
    team, event_id: eventId, overrides
  }, { onConflict: 'team,event_id' });
}
