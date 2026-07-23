import { RosterEvent, EventType } from '../lib/roster-engine';

export interface CycleDefinition {
  team: 'A' | 'B';
  label: string;
  events: { date: string; name: string; type: EventType; congregation?: boolean }[];
}

// All 12 duty cycles for 2026
export const CYCLES: CycleDefinition[] = [
  {
    team: 'A',
    label: 'Jan 19 – Feb 16',
    events: [
      { date: '2026-01-19', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-01-24', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-01-27', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-01-31', name: 'Student Mijalis', type: 'student' },
    ],
  },
  {
    team: 'B',
    label: 'Feb 17 – Mar 18',
    events: [
      { date: '2026-02-17', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-02-21', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-02-25', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-02-28', name: 'Student Mijalis', type: 'student' },
      { date: '2026-03-04', name: 'Imamat Day', type: 'eid' },
    ],
  },
  {
    team: 'A',
    label: 'Mar 19 – Apr 16',
    events: [
      { date: '2026-03-19', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-03-20', name: 'Eid-al-Fitr', type: 'eid' },
      { date: '2026-03-21', name: 'Navroz', type: 'navroz' },
      { date: '2026-03-22', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-03-27', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-03-28', name: 'Student Mijalis', type: 'student' },
      { date: '2026-04-03', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-04-10', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'B',
    label: 'Apr 17 – May 16',
    events: [
      { date: '2026-04-17', name: 'Chandraat Beej', type: 'chandraat' },
      { date: '2026-04-18', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-04-24', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-04-25', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-05-01', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-05-02', name: 'Student Mijalis', type: 'student' },
      { date: '2026-05-08', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-05-15', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'A',
    label: 'May 17 – Jun 14',
    events: [
      { date: '2026-05-17', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-05-22', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-05-23', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-05-25', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-05-27', name: 'Eid-al-Adha', type: 'eid' },
      { date: '2026-05-29', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-05-30', name: 'Student Mijalis', type: 'student' },
      { date: '2026-06-03', name: 'Eid-al-Ghadir', type: 'eid' },
      { date: '2026-06-05', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-06-12', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'B',
    label: 'Jun 15 – Jul 13',
    events: [
      { date: '2026-06-15', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-06-19', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-06-20', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-06-23', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-06-26', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-06-27', name: 'Student Mijalis', type: 'student' },
      { date: '2026-07-03', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-07-10', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'A',
    label: 'Jul 14 – Aug 12',
    events: [
      { date: '2026-07-14', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-07-17', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-07-18', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-07-21', name: 'Yawm-i Ali', type: 'eid' },
      { date: '2026-07-22', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-07-24', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-07-25', name: 'Student Mijalis', type: 'student' },
      { date: '2026-07-31', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-08-07', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'B',
    label: 'Aug 13 – Sep 10',
    events: [
      { date: '2026-08-13', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-08-15', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-08-21', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-08-22', name: 'Student Mijalis', type: 'student' },
      { date: '2026-08-24', name: 'Milad al-Nabi', type: 'eid' },
      { date: '2026-08-28', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-09-04', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'A',
    label: 'Sep 11 – Oct 10',
    events: [
      { date: '2026-09-11', name: 'Chandraat Beej', type: 'chandraat' },
      { date: '2026-09-12', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-09-19', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-09-25', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-09-26', name: 'Student Mijalis', type: 'student' },
      { date: '2026-10-02', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-10-09', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'B',
    label: 'Oct 11 – Nov 9',
    events: [
      { date: '2026-10-11', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-10-12', name: 'Salgirah', type: 'eid' },
      { date: '2026-10-17', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-10-19', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-10-23', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-10-24', name: 'Student Mijalis', type: 'student' },
      { date: '2026-10-30', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-11-06', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'A',
    label: 'Nov 10 – Dec 8',
    events: [
      { date: '2026-11-10', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-11-13', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-11-14', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-11-18', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-11-20', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-11-21', name: 'Student Mijalis', type: 'student' },
      { date: '2026-11-27', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-12-04', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
  {
    team: 'B',
    label: 'Dec 9 – Jan 2027',
    events: [
      { date: '2026-12-09', name: 'Chandraat', type: 'chandraat' },
      { date: '2026-12-11', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-12-12', name: 'Baithulkhayal', type: 'baithulkhayal' },
      { date: '2026-12-17', name: 'Paanch Baar Saal', type: 'paanch' },
      { date: '2026-12-18', name: 'Friday Majlis', type: 'friday', congregation: true },
      { date: '2026-12-19', name: 'Student Mijalis', type: 'student' },
      { date: '2026-12-21', name: 'Yawm-i Ali', type: 'eid' },
      { date: '2026-12-25', name: 'Friday Majlis', type: 'friday', congregation: true },
    ],
  },
];

/**
 * Convert a cycle's events into RosterEvent[] format suitable for the engine.
 */
export function cycleToRosterEvents(cycle: CycleDefinition): RosterEvent[] {
  return cycle.events.map((ev) => ({
    id: `${ev.date}_${ev.type}`,
    name: ev.name,
    date: ev.date,
    dateRaw: ev.date,
    type: ev.type,
    congregation: ev.congregation,
  }));
}

/**
 * Get cycles for a specific team.
 */
export function getCyclesForTeam(team: 'A' | 'B'): CycleDefinition[] {
  return CYCLES.filter((c) => c.team === team);
}
