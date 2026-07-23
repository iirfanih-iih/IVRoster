import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pvopusxiipswhcjlspfh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b3B1c3hpaXBzd2hjamxzcGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTEwMDcsImV4cCI6MjA5NDQ2NzAwN30.rfob3VgKdfwNKWiVi5YfEkUvS6iTvW4nWtVTPaOmGrk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth Helpers ───

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ─── DB Helpers ───

export async function dbLoadRosters(team: string) {
  const { data, error } = await supabase
    .from('rosters')
    .select('*')
    .eq('team', team);
  if (error) throw error;
  return data || [];
}

export async function dbSaveRoster(
  team: string,
  eventId: string,
  roster: any,
  confirmed: boolean
) {
  const session = await getSession();
  const { error } = await supabase.from('rosters').upsert(
    {
      team,
      event_id: eventId,
      roster,
      confirmed,
      updated_by: session?.user?.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'team,event_id' }
  );
  if (error) throw error;
}

export async function dbLoadOverrides(team: string) {
  const { data } = await supabase
    .from('manual_overrides')
    .select('*')
    .eq('team', team);
  return data || [];
}

export async function dbSaveOverride(
  team: string,
  eventId: string,
  overrides: any
) {
  await supabase.from('manual_overrides').upsert(
    { team, event_id: eventId, overrides },
    { onConflict: 'team,event_id' }
  );
}

export async function dbLoadMemberState(team: string) {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', `member_state_${team}`)
    .maybeSingle();
  if (!data) return null;
  return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
}

export async function dbSaveMemberState(team: string, memberState: any) {
  await supabase.from('app_settings').upsert(
    {
      key: `member_state_${team}`,
      value: JSON.stringify(memberState),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
}

// ─── Audit Logging ───

export async function auditLog(
  action: string,
  category: string,
  detail: string,
  userEmail?: string,
  userName?: string
) {
  await supabase.from('audit_logs').insert({
    ts: new Date().toISOString(),
    username: userEmail || 'unknown',
    user_display: userName || 'Unknown',
    action,
    category,
    detail,
  });
}

// ─── Feedback ───

export async function loadFeedback() {
  const { data } = await supabase
    .from('feedback')
    .select('*')
    .order('ts', { ascending: false })
    .limit(50);
  return data || [];
}

export async function submitFeedback(post: {
  id: string;
  type: string;
  text: string;
  ts: string;
  username: string;
  user_display: string;
  replies: any[];
}) {
  await supabase.from('feedback').insert(post);
}

// ─── Leadership Contacts ───

export async function loadLeadershipContacts() {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'leadership_contacts')
    .maybeSingle();
  if (!data?.value) return null;
  return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
}

export async function saveLeadershipContacts(contacts: any[]) {
  await supabase.from('app_settings').upsert(
    {
      key: 'leadership_contacts',
      value: JSON.stringify(contacts),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
}
