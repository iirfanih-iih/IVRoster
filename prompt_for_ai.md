# AI Agent Context — IV Roster Generator

## Project Structure
- `iv_team_a_roster.html` — Team A standalone roster generator
- `iv_team_b_roster.html` — Team B standalone roster generator (mirrors Team A logic/UI)
- `iv-logo.png` — Shared logo
- `README.md` — Full documentation

## Key Architecture
- Single HTML files, no build tools, no server
- Libraries loaded via CDN: html2canvas, xlsx-js-style
- State persisted in localStorage (`rosterGeneratorState` for A, `rosterGeneratorStateB` for B)
- All logic in `<script>` tag within each HTML file

## Important Constants
- `MEMBERS` — team member list with name, age, nandi flag
- `DUTIES` — duty lists per event type
- `DUTY_ASSIGNMENT_CONFIG` — assignment logic per duty
- `REPEAT_ALLOWED_DUTIES` — duties that can repeat within a cycle
- `HARD_REQUIRED_DUTIES` — duties that must be filled (fallback enabled)

## Key Functions
- `_generateRosterLogic(ev)` — core generation algorithm
- `pick(pool, count, duty, allowFallback, ignoreUsed)` — member selection with fairness
- `generateAllRosters()` — generates all events in selected cycle (chandraat-based grouping)
- `exportCycleToExcel()` — exports cycle to formatted xlsx (vertical layout)
- `exportRosterImage(i)` — exports single event as PNG
- `renderFairnessHTML()` — 3-view fairness tab (person/duty/gaps)
- `renderCycleSummaryHTML()` — cycle overview with Generate All + Export Excel buttons

## Cycle Grouping Logic
Events are grouped into cycles starting at each Chandraat event. The sidebar, Generate All, and Export Excel all use this same chandraat-based grouping (not `getEventPeriodKey`).

## When Modifying
1. Both Team A and Team B files should have matching UI/logic (except members/events/historical data)
2. Team A uses `TEAM_A_NAMES`, Team B uses `TEAM_B_NAMES`
3. Team A has historical March 2026 roster data seeded in `seedMarch()`; Team B has none yet
4. After code changes, clear localStorage to test fresh: `localStorage.removeItem('rosterGeneratorState'); location.reload();`
5. Excel export format: vertical stacked events, Calibri font, title=bold red sz18, headers=bold blue sz13, duties=bold black sz16, names=sz13, all text cells have borders, title centered

## Duty Cycle Rules
- Alternate lunar months (not calendar)
- Team A = odd cycles (1,3,5,7,9,11), Team B = even cycles (2,4,6,8,10,12)
- Each cycle starts with Chandraat
- No same duty repeat within cycle (except REPEAT_ALLOWED_DUTIES)
- Nandi Line & Nandi Passing always last — absorb remaining unassigned members
