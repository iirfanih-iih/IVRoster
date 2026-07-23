# Supabase Database Schema Reference

## Tables

### `profiles`
Stores user account metadata (linked to Supabase Auth users).

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',  -- 'admin' | 'team_leader' | 'viewer'
  team TEXT,                             -- 'A' | 'B' | NULL (admin = all)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `rosters`
Stores generated roster data per event per team.

```sql
CREATE TABLE rosters (
  id BIGSERIAL PRIMARY KEY,
  team TEXT NOT NULL,          -- 'A' or 'B'
  event_id TEXT NOT NULL,      -- e.g. '2026-03-19_chandraat'
  roster JSONB,                -- Array of {duty, male:[], female:[]}
  confirmed BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team, event_id)
);
```

### `manual_overrides`
Tracks substitutions made by team leaders.

```sql
CREATE TABLE manual_overrides (
  id BIGSERIAL PRIMARY KEY,
  team TEXT NOT NULL,
  event_id TEXT NOT NULL,
  overrides JSONB,             -- Object tracking swap history
  UNIQUE(team, event_id)
);
```

### `app_settings`
Generic key-value store for app configuration.

```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `audit_logs`
Immutable audit trail of all significant actions.

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT now(),
  username TEXT,
  user_display TEXT,
  action TEXT,
  category TEXT,
  detail TEXT,
  ip TEXT
);
```

### `feedback`
User-submitted feedback with threaded replies.

```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  type TEXT,                   -- 'bug' | 'feature' | 'suggestion' | 'feedback' | 'qa'
  text TEXT,
  ts TIMESTAMPTZ DEFAULT now(),
  username TEXT,
  user_display TEXT,
  replies JSONB DEFAULT '[]'   -- Array of {user, text, ts}
);
```

---

## Row Level Security (RLS) Policies

Ensure these are configured in Supabase Dashboard → Database → Policies:

### `profiles`
- SELECT: Authenticated users can read all profiles
- INSERT: Only via edge function (service role)
- UPDATE: Admins can update any; users can update own

### `rosters`
- SELECT: All authenticated users
- INSERT/UPDATE: Admins + team_leaders for their team
- DELETE: Admins only

### `manual_overrides`
- SELECT: All authenticated users
- INSERT/UPDATE: Admins + team_leaders for their team

### `app_settings`
- SELECT: All authenticated users
- INSERT/UPDATE: Admins only

### `audit_logs`
- SELECT: Admins only
- INSERT: All authenticated users (for logging)

### `feedback`
- SELECT: All authenticated users
- INSERT: All authenticated users
- UPDATE: All authenticated users (for replies)

---

## Realtime Configuration

Enable Realtime on the `rosters` table:
- Supabase Dashboard → Database → Replication → Enable for `rosters`

This allows live sync when multiple team leaders are working simultaneously.

---

## Edge Function Secrets

Set via: Supabase Dashboard → Edge Functions → Secrets

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend.com API key for sending notification emails |

Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in edge functions.
