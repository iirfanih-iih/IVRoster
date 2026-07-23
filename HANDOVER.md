# IV Roster Generator — Developer Handover Document

**Prepared by**: Irfan Ismail  
**Date**: June 2026  
**Project**: Auckland Ismaili Volunteers Roster Management System

---

## Table of Contents
1. [Project Summary](#1-project-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [File Map & Responsibilities](#3-file-map--responsibilities)
4. [Tech Stack](#4-tech-stack)
5. [Backend (Supabase)](#5-backend-supabase)
6. [Authentication & Roles](#6-authentication--roles)
7. [Roster Generation Algorithm](#7-roster-generation-algorithm)
8. [Data Flow & State Management](#8-data-flow--state-management)
9. [Key Features Explained](#9-key-features-explained)
10. [Deployment & Hosting](#10-deployment--hosting)
11. [How to Make Common Changes](#11-how-to-make-common-changes)
12. [Known Limitations & Technical Debt](#12-known-limitations--technical-debt)
13. [Credentials & Access](#13-credentials--access)
14. [Troubleshooting Guide](#14-troubleshooting-guide)

---

## 1. Project Summary

This is a **browser-based roster generator** for the Auckland Ismaili Volunteers (IV) program. It automatically assigns duties to ~121 volunteers across two teams (A & B) for religious events at Auckland Jamatkhana.

**Key goals:**
- Fair duty distribution using an algorithm
- Role-based access (Admin, Team Leader, Viewer)
- Real-time sync across devices via Supabase
- Export to Excel and Image
- Audit logging of all critical actions
- Email notifications for critical events

**Users:**
- 2 Team Leaders (one per team)
- 1 Admin (you/system owner)
- Viewers (optional read-only accounts)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                       │
├─────────────────────────────────────────────────────────┤
│  index.html          → Dashboard/Portal (login, nav)     │
│  iv_team_a_roster.html → Team A roster generator         │
│  iv_team_b_roster.html → Team B roster generator         │
│  admin.html          → Admin panel (user mgmt, audit)    │
├─────────────────────────────────────────────────────────┤
│  supabase-config.js  → Shared Supabase client + helpers  │
│  theme.js            → Dark/Light/System theme toggle    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE (Backend)                       │
├─────────────────────────────────────────────────────────┤
│  Auth         → Email/password authentication            │
│  Database     → PostgreSQL (rosters, profiles, etc.)     │
│  Realtime     → Live sync of roster changes              │
│  Edge Funcs   → create-user, reset-password, send-notif  │
│  Storage      → (not currently used)                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  RESEND (Email)                           │
│  Sends notifications for critical actions                │
│  Recipient: iirfanih@gmail.com                           │
└─────────────────────────────────────────────────────────┘
```

**Important**: There is NO build step. All HTML files are standalone and run directly in the browser. Libraries are loaded via CDN.

---

## 3. File Map & Responsibilities

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~776 | Main portal: login screen, dashboard, calendar, cycles, leadership contacts, duty guide, docs, feedback system |
| `iv_team_a_roster.html` | ~2022 | Team A roster generator (all logic self-contained) |
| `iv_team_b_roster.html` | ~1786 | Team B roster generator (mirrors Team A) |
| `admin.html` | ~280 | Admin panel: user CRUD, audit logs, member search, backup |
| `supabase-config.js` | ~250 | Shared module: Supabase client init, auth helpers, DB helpers, realtime, audit logging, rate limiting, password validation, email notifications, custom prompt/alert |
| `theme.js` | ~35 | Theme toggle (dark/light/system) with localStorage persistence |
| `manifest.json` | PWA manifest for installability |
| `iv-logo.png` | Branding logo |
| `2026-Calendar-Auckland.pdf` | Year calendar PDF (embedded in dashboard) |
| `supabase/config.toml` | Supabase edge function config |
| `supabase/functions/create-user/index.ts` | Edge function: admin creates new users |
| `supabase/functions/reset-password/index.ts` | Edge function: admin resets user passwords |
| `supabase/functions/send-notification/index.ts` | Edge function: sends email via Resend API |

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Fonts | Google Fonts: Lexend, Barlow, DM Sans |
| Export | html2canvas (PNG), xlsx-js-style (Excel) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Edge Functions | Deno (TypeScript) |
| Email | Resend API |
| Hosting | GitHub Pages (static files) |
| Theme | CSS custom properties with class toggle |

**CDN Dependencies:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## 5. Backend (Supabase)

### Project URL
```
https://pvopusxiipswhcjlspfh.supabase.co
```

### Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User accounts & roles | id, email, name, role, team, created_at |
| `rosters` | Generated roster data | team, event_id, roster (JSON), confirmed, updated_by, updated_at |
| `manual_overrides` | Substitution tracking | team, event_id, overrides (JSON) |
| `app_settings` | Key-value config store | key, value, updated_at |
| `audit_logs` | Action audit trail | ts, username, user_display, action, category, detail, ip |
| `feedback` | User feedback/bugs | id, type, text, ts, username, user_display, replies (JSON) |

### Key `app_settings` Keys
- `leadership_contacts` — JSON array of contact objects
- `member_state_A` / `member_state_B` — Member active/inactive state per team
- `force_pw_change_{user_id}` — Flag to force password change on next login

### Realtime Subscriptions
- Roster table changes are subscribed per team (`team=eq.A` or `team=eq.B`)
- Changes from other users appear instantly without page refresh
- A 2-second pause is applied after local saves to prevent echo

### Edge Functions
All require admin JWT in Authorization header:
1. **create-user** — Creates auth user + profile row (bypasses email confirmation)
2. **reset-password** — Updates user password via service role
3. **send-notification** — Sends HTML email via Resend API to admin

---

## 6. Authentication & Roles

### Role Hierarchy
| Role | Permissions |
|------|------------|
| `admin` | Full access to everything. Can create/edit users, view audit logs, edit contacts, access both teams. |
| `team_leader` | Can generate/edit/confirm rosters for their assigned team only. Can view (not edit) the other team. |
| `viewer` | Read-only access to rosters. Cannot generate or modify. |

### Auth Flow
1. User enters email/password on `index.html` login screen
2. Supabase Auth validates credentials
3. Profile fetched from `profiles` table
4. Force password change checked (`app_settings`)
5. Dashboard rendered based on role
6. Session persists via Supabase's built-in token refresh

### Security Features
- Rate limiting: 5 login attempts/minute, 3 reset attempts/minute
- Password complexity: 8+ chars, 1 uppercase, 1 number, 1 special char
- Force password change on first login for new users
- IP logging on all audit entries
- Authorised access warning on login screen

---

## 7. Roster Generation Algorithm

Located in `iv_team_a_roster.html` and `iv_team_b_roster.html` (function `_generateRosterLogic`).

### Core `pick()` Function Logic
```
1. Filter eligible members (age group, gender, nandi flag)
2. Exclude members already assigned in this event
3. Exclude members who did this duty already in this cycle
   (unless duty is in REPEAT_ALLOWED_DUTIES)
4. Sort by fairness:
   - Primary: fewest total duties assigned
   - Secondary: hasn't done this specific duty before
   - Tie-breaker: random (Math.random)
5. Pick top N candidates
6. For HARD_REQUIRED_DUTIES (Nandi): if no candidates, 
   relax cycle-repeat rule and try again
```

### Member Categories
- **Child**: age < 12
- **Youth**: age 12–17
- **Adult**: age 18+

### Repeatable Duties (can be assigned multiple times per cycle)
- Nandi Line, Nandi Passing, Nandi Set-up, Nandi Centre, Nandi Trolley, Nandi Distribution

### Duty Processing Order
Duties are processed in a specific order. **Nandi Line** and **Nandi Passing** are always LAST because they absorb all remaining unassigned members.

### Fairness Tracking
- Each member's total duty count is tracked across the entire cycle
- Per-duty counts are also tracked
- The algorithm always prefers the person with the fewest assignments

---

## 8. Data Flow & State Management

### State Storage (Dual: Supabase + localStorage)

```
Generate Roster → Save to Supabase (primary) + localStorage (fallback)
                → Broadcast via Realtime to other connected clients
                → Other clients receive update and re-render

Load Page → Check Supabase for saved rosters
          → If offline, fall back to localStorage
          → Code-defined events always override saved event list
```

### localStorage Keys
- `rosterGeneratorState` — Team A state
- `rosterGeneratorStateB` — Team B state
- `iv_leadership` — Leadership contacts (fallback)
- `iv-theme` — Theme preference (dark/light/system)

### Important: Events are Code-Defined
The event list (dates, names, types) is hardcoded in each roster HTML file's `setupEvents()` function. User-added events (via "Add Event" modal) are preserved in state, but code-defined events always take priority on load.

---

## 9. Key Features Explained

### Generate All (Cycle Overview Tab)
- Generates rosters for ALL events in the currently selected cycle
- Uses chandraat-based cycle grouping (cycle starts at each Chandraat event)
- Processes events sequentially so fairness carries forward

### Export to Excel
- Uses `xlsx-js-style` library
- Vertical layout: events stacked with title → headers → duty rows
- Styling: Title = bold red size 18, Headers = bold blue size 13, Duties = bold black size 16, Names = size 13
- All cells have borders, Calibri font

### Export to Image
- Uses `html2canvas` to capture roster card as PNG
- Substitution buttons are hidden during capture

### Substitutions
- Team Leaders can swap individual members in a generated roster
- Click the ↔ button next to a name
- Shows eligible replacements filtered by same duty rules
- Tracked in `manual_overrides` table

### Fairness Tab (3 Views)
1. **Per Person** — Progress bars showing each member's total duty count
2. **Per Duty** — Each duty type with assignment stats
3. **Gaps** — Members never assigned in the cycle + per-event unassigned lists

### Feedback System
- Built into `index.html` dashboard
- Types: Bug, Feature Request, Suggestion, General Feedback, QA Note
- Supports threaded replies
- Stored in Supabase `feedback` table

---

## 10. Deployment & Hosting

### Current Setup
- Static files hosted on **GitHub Pages**
- URL pattern: `https://<username>.github.io/IVRoster/`
- No build step — just push HTML files to the repo

### To Deploy Changes
```bash
git add .
git commit -m "description of change"
git push origin main
```
GitHub Pages auto-deploys from the main branch.

### Supabase Edge Functions
Deploy via Supabase CLI:
```bash
cd supabase
supabase functions deploy create-user
supabase functions deploy reset-password
supabase functions deploy send-notification
```

### Environment Variables (Supabase Dashboard → Edge Functions → Secrets)
- `RESEND_API_KEY` — API key for Resend email service

---

## 11. How to Make Common Changes

### Add/Remove a Team Member
1. Open `iv_team_a_roster.html` or `iv_team_b_roster.html`
2. Find `const MEMBERS` object in the `<script>` section
3. Add/remove entry: `{name: 'Full Name', age: 25, nandi: false}`
4. Gender is determined by the key (`male` or `female` array)
5. Clear localStorage after: `localStorage.removeItem('rosterGeneratorState'); location.reload();`

### Add/Modify Events for a Cycle
1. Open the relevant roster HTML file
2. Find `setupEvents()` function
3. Edit the cycle arrays (events are grouped by chandraat)
4. Clear localStorage after changes

### Change Duty Rules
1. Find `DUTY_ASSIGNMENT_CONFIG` in the roster HTML file
2. Each key is a duty name with its assignment function
3. Modify the logic (eligible pool, count, gender rules)

### Add a New User Account
1. Log in as Admin → Admin Panel → Users tab
2. Fill in name, email, password, role, team
3. User will be forced to change password on first login

### Update Leadership Contacts
1. Log in as Admin → Dashboard → Leadership & Contacts
2. Click "Edit Contacts" → modify fields → Save
3. Saved to Supabase `app_settings` table

### Update the Year Calendar PDF
1. Replace `2026-Calendar-Auckland.pdf` with the new file (same filename)
2. Push to GitHub

### Change Notification Email Recipient
1. Edit `supabase/functions/send-notification/index.ts`
2. Change `NOTIFY_EMAIL` constant
3. Redeploy the edge function

---

## 12. Known Limitations & Technical Debt

| Issue | Impact | Suggested Fix |
|-------|--------|---------------|
| All logic in single HTML files (2000+ lines each) | Hard to maintain | Consider splitting into modules with a bundler |
| Team A and B files are near-duplicates | Changes must be made in both | Extract shared logic into a common JS file |
| No automated tests | Regressions possible | Add unit tests for `pick()` and duty assignment |
| No CI/CD pipeline | Manual deployment | Add GitHub Actions for linting/deployment |
| Supabase anon key is in client-side code | Normal for Supabase (RLS protects data) | Ensure Row Level Security policies are tight |
| No offline-first PWA support | Requires internet for auth | Could add service worker for offline viewing |
| Event dates are hardcoded | Must update code each year | Could move to Supabase table |
| No undo for "Generate All" | Accidental overwrite risk | Add confirmation or undo buffer |
| PDF calendar is a static file | Must be manually replaced yearly | Could generate dynamically |

---

## 13. Credentials & Access

### Supabase Project
- **Dashboard**: https://supabase.com/dashboard (login with project owner's account)
- **Project ref**: `pvopusxiipswhcjlspfh`
- **Region**: Check Supabase dashboard

### Key Secrets (DO NOT commit to git)
- Supabase Service Role Key → Supabase Dashboard → Settings → API
- Resend API Key → Set as Supabase Edge Function secret
- Admin user credentials → Created via Admin Panel

### GitHub Repository
- Ensure you have push access to the repo hosting the GitHub Pages site
- The `manifest.json` references start_url `/IVRoster/` — update if repo name changes

### To Transfer Ownership
1. Add new owner as admin in Supabase project (Organization → Members)
2. Transfer GitHub repo ownership
3. Update `NOTIFY_EMAIL` in send-notification function
4. Create a new admin account in the app for the new owner
5. Update Resend API key if changing email sender

---

## 14. Troubleshooting Guide

### "Supabase not connected" / Sync dot is grey
- Check browser console for errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `supabase-config.js`
- Check Supabase project status (may be paused if on free tier after inactivity)

### Roster not generating / empty results
- Check browser console for errors in `pick()` function
- Verify `MEMBERS` array has correct data
- Clear localStorage: `localStorage.removeItem('rosterGeneratorState'); location.reload();`

### User can't log in
- Check if user exists in Supabase Auth (Dashboard → Authentication → Users)
- Check if profile exists in `profiles` table
- Try resetting password via Admin Panel

### Edge function errors (create-user, reset-password)
- Check Supabase Dashboard → Edge Functions → Logs
- Verify the calling user has `admin` role in `profiles` table
- Check CORS headers if getting blocked

### Realtime not working
- Check browser console for subscription errors
- Verify Supabase Realtime is enabled (Dashboard → Database → Replication)
- Ensure the `rosters` table has Realtime enabled

### After code changes, old data appears
```javascript
// Run in browser console:
localStorage.removeItem('rosterGeneratorState');
localStorage.removeItem('rosterGeneratorStateB');
location.reload();
```

### Supabase project paused (free tier)
- Go to Supabase Dashboard → Project → Resume
- Free tier pauses after 7 days of inactivity
- Consider upgrading to Pro for production use

---

## Quick Start for New Developer

1. **Clone the repo** and open in your editor
2. **Open `index.html`** in a browser — you'll see the login screen
3. **Get admin credentials** from the previous owner
4. **Read `README.md`** for duty rules and business logic
5. **Read `prompt_for_ai.md`** for AI-assisted development context
6. **Access Supabase Dashboard** to understand the database schema
7. **Make changes** → test locally → push to GitHub → auto-deploys

**That's it. The entire app is just HTML files + a Supabase backend. No build tools, no npm, no framework.**
