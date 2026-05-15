# IV Roster Generator

## 1. Project Overview

This project is a web-based **Automatic Roster Generator** for the Ismaili Volunteers (IV) teams. It automates the complex task of assigning duties to team members for various events.

The tool is designed to be used by a Team Leader to create fair, compliant, and efficient rosters. Each team has its own standalone HTML file that runs entirely in the browser with no server-side components.

### Files

| File | Purpose |
|------|---------|
| `iv_team_a_roster.html` | Team A roster generator (all 2026 cycles) |
| `iv_team_b_roster.html` | Team B roster generator (all 2026 cycles) |
| `iv-logo.png` | Shared IV logo for header branding |
| `prompt_for_ai.md` | AI agent context for code modifications |
| `archive/` | Historical reference files (old backups, spreadsheets, etc.) |

---

## 2. Core Concepts

- **Members**: Predefined list with `name`, `age`, `gender`, and `nandi` flag (Nandi-experienced).
- **Groups**: Auto-categorized by age — **Child** (<12), **Youth** (12–17), **Adult** (18+).
- **Events**: Scheduled events with a type (Friday, Chandraat, etc.) determining available duties.
- **Duties**: Responsibilities with specific eligibility rules per duty.
- **Fairness Algorithm**: Distributes duties equitably using historical counts.
- **Duty Cycle**: Alternate lunar month cycle (not calendar month). Team A and Team B alternate. Each cycle starts with Chandraat.

---

## 3. Team Structure

### Team A
- 27 Males, 32 Females (59 total)
- 7 Nandi-experienced Males + 4 Nandi-experienced Females
- Historical baseline: March–April 2026 (8 events)

### Team B
- 30 Males, 32 Females (62 total)
- Nandi-experienced: Aziz Barolia, Rahim Harjee, Dilawar Dhanani, Faiyaz Peerbhoy, Imran Bandeali, Rahim Jelani, Sajid Abbas (M) + Angoma Peerbhai, Fareesa Lokhandwala, Khadija Parmar, Noorjahan Jivani, Aliza Jivani (F)
- Historical baseline: April–May 2026 (no preset data yet)

---

## 4. Duty Cycles & Events

We follow **alternate lunar month** duty cycles, NOT calendar months.

### Team A Cycles (Odd: 1, 3, 5, 7, 9, 11)
- Cycle 1: Jan–Feb 2026
- Cycle 3: Mar–Apr 2026 (Historical)
- Cycle 5: May–Jun 2026
- Cycle 7: Jul–Aug 2026
- Cycle 9: Sep–Oct 2026
- Cycle 11: Nov–Dec 2026

### Team B Cycles (Even: 2, 4, 6, 8, 10, 12)
- Cycle 2: Feb–Mar 2026
- Cycle 4: Apr–May 2026 (Historical)
- Cycle 6: Jun–Jul 2026
- Cycle 8: Aug–Sep 2026
- Cycle 10: Oct–Nov 2026
- Cycle 12: Dec 2026–Jan 2027

**Important**: Team B events are NOT shown in Team A roster and vice versa.

---

## 5. The Generation Algorithm

The `pick()` function selects members for each duty slot:

1. **Filter for Basic Eligibility** — age group, gender, nandi flag
2. **Apply Exclusion Rules**:
   - **Used in Event**: No member assigned twice in same event
   - **Duty Cycle Repeat**: No same duty within same cycle (except Nandi Line, Nandi Passing, Nandi Set-up, Nandi Centre, Nandi Trolley, Nandi Distribution)
3. **Fairness Sorting**:
   - Primary: fewest total duties
   - Secondary: hasn't done this specific duty before
   - Tie-breaker: random
4. **Hard Requirement Fallback**: For `Nandi` duty, ignores cycle repeat if no candidates remain. Disabled for `Sukreet`.

---

## 6. Duty-Specific Rules

| Duty | Rules |
|------|-------|
| **Nandi** | 2 Nandi-experienced Adults. Random mix: 2M, 2F, or 1M+1F. Hard-required. |
| **Nandi Labelling** | 2 Adult/Youth females. 40% chance males on Chandraat. |
| **Nandi Line** | 4–10 per gender. Absorbs remaining Adults/Youth. Repeatable. |
| **Nandi Passing** | 3–8 per gender. Absorbs remaining Children/Youth. Repeatable. |
| **Nandi Centre** | 1 person (Adult/Youth). Random gender. Repeatable. |
| **Nandi Trolley** | 1 person (Adult/Youth). Random gender. Repeatable. |
| **Nandi Set-up** | 1M + 1F (Adult/Youth). Repeatable. |
| **Nandi Distribution** | 1M + 1F (Adult/Youth). Repeatable. |
| **Prayer Hall Entrance** | 2M Children + 2F Children. Fallback to Youth. |
| **Shoe Entrance** | 1M Youth + 1F Youth. Fallback to Adults. |
| **Number 1** | 1M + 1F (Adult/Youth). |
| **Seating & Discipline** | 1 Adult + 1 Youth per gender. |
| **Sukreet** | Per gender: 60% chance 1 Adult + 1 Youth, else 2 Adults. |
| **Sukreet & Ghatpaat Closing** | 1M + 1F. Prioritizes Youth. |
| **Safety Exit Door/Discipline** | Female only. 50% chance 1 Adult + 1 Youth, else 1 Adult. |
| **Chai Station** | Adults only. 1–2M, 0–1F. Friday & Chandraat only. |
| **Chai Station Pack-up** | 1 Adult Male + 1 Youth. Friday & Chandraat only. |
| **Water Station** | 1M + 1F (Adult/Youth). Chandraat & Navroz only. |

**Duty ordering**: Nandi Line and Nandi Passing are always last in the duty list — they absorb all remaining unassigned members.

---

## 7. Features

### Generate All (Cycle Overview tab)
- Generates rosters for all events in the selected cycle at once.
- Uses chandraat-based cycle grouping (same as sidebar).

### Export to Excel (Cycle Overview tab)
- Exports all generated rosters in the cycle to a formatted `.xlsx` file.
- Vertical layout: each event stacked with title → Duty/Male/Female headers → duty rows.
- Formatting: Title bold red size 18, headers bold blue size 13, duties bold black size 16, names size 13, all borders, Calibri font.
- Uses `xlsx-js-style` library for cell styling.

### Export to Image
- 📷 Export button captures the roster card as a high-res PNG using html2canvas.
- Substitution buttons are hidden during capture for clean output.

### Fairness Tab (3 views)
- **👤 Per Person**: Shows each member's total duty count with progress bars. Click for detailed breakdown.
- **📋 Per Duty**: Shows each duty type with total assignments, unique member count, and top assignees.
- **⚠️ Gaps**: Shows members never assigned in the cycle and per-event unassigned lists.

### Congregation Events
- Events with `congregation: true` add youth-focused duties:
  - MPH Hall Entrance: 1 Child/Youth per gender
  - Seating & Discipline (Youth): 1 Youth per gender
  - Sukreet & Ghatpaat Closing (Youth): 1 Youth/Adult per gender

### Child Safety
- Children (<12) only assigned to: Prayer Hall Entrance, MPH Hall Entrance, Nandi Passing, Shoe Entrance.

### Local Storage Persistence
- All state (rosters, overrides, confirmations) saved to localStorage.
- Team A uses key `rosterGeneratorState`, Team B uses `rosterGeneratorStateB`.
- Code-defined events always take priority over saved state.
- User-added events from "Add Event" modal are preserved across sessions.

---

## 8. How to Update

### Members
Edit the `const MEMBERS` object in the `<script>` section. Each member needs `name`, `age`, `nandi`.

### Events
Edit cycle arrays in `setupEvents()`.

### Duty Rules
Edit `DUTY_ASSIGNMENT_CONFIG` object — each key is a duty name with its assignment function.

### After Changes
Clear localStorage: open browser console → `localStorage.removeItem('rosterGeneratorState'); location.reload();`

---

## 9. Change Log

- **2026-06-15**: Updated Team B roster to match Team A features (Excel export, fairness views, generate all, image export). Updated README.
- **2026-06-14**: Added export-to-image feature (html2canvas). Added export-to-Excel (xlsx-js-style). Added Fairness tab with 3 views (Per Person, Per Duty, Gaps). Moved Generate All and Export Excel to Cycle Overview tab. Fixed generateAllRosters to use chandraat-based cycle grouping. Fixed duplicate generateAllRosters. Fixed manualOverrides tracking bug. Fixed REPEAT_ALLOWED_DUTIES mutation. Fixed TYPE_LABELS for eid events. Fixed loadState vs setupEvents conflict. Created Team B roster file. Archived old reference files.
- **2026-03-28**: Initial release with March 2026 historical data, fairness algorithm, and IV branding.
