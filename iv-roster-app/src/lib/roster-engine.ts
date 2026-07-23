/**
 * IV Roster Generation Engine
 * Ported from the web app's _generateRosterLogic function.
 * This is a pure function — no side effects, no state mutations.
 */

// ─── Types ───

export interface Member {
  name: string;
  age: number;
  nandi: boolean;
  inactive?: boolean;
  note?: string;
}

export interface MembersData {
  male: Member[];
  female: Member[];
}

export interface RosterEvent {
  id: string;
  name: string;
  date: string;
  dateRaw?: string;
  type: EventType;
  congregation?: boolean;
  notes?: string;
  locked?: boolean;
}

export type EventType =
  | 'friday'
  | 'chandraat'
  | 'baithulkhayal'
  | 'paanch'
  | 'student'
  | 'eid'
  | 'navroz';

export interface DutyRow {
  duty: string;
  male: string[];
  female: string[];
  isNandi: boolean;
  section: 'adults' | 'youth';
}

export interface DutyHistory {
  [memberName: string]: number; // total duty count
}

export interface PrevAssignment {
  duty: string;
  ev: string;
  period: string;
}

export interface PrevAssignments {
  [memberName: string]: PrevAssignment[];
}

// ─── Constants ───

const isChild = (m: Member) => m.age < 12;
const isYouth = (m: Member) => m.age >= 12 && m.age < 18;
const isAdult = (m: Member) => m.age >= 18;
const isActive = (m: Member) => !m.inactive;

const HAS_CHAI = new Set(['friday', 'chandraat']);

export const CHILD_ALLOWED = new Set([
  'Prayer Hall Entrance',
  'MPH Hall Entrance',
  'Nandi Passing',
  'Shoe Entrance',
]);

export const REPEAT_ALLOWED_DUTIES = new Set([
  'Nandi Line',
  'Nandi Passing',
  'Nandi Set-up',
  'Nandi Centre',
  'Nandi Trolley',
  'Nandi Distribution',
]);

const HARD_REQUIRED_DUTIES = new Set(['Nandi']);

const YOUTH_DUTIES = [
  'MPH Hall Entrance',
  'Seating & Discipline',
  'Sukreet',
  'MPH Paat Windup',
];

export const DUTIES: Record<string, string[]> = {
  friday: [
    'Nandi Labelling', 'Number 1', 'Prayer Hall Entrance', 'Shoe Entrance',
    'Seating & Discipline', 'Sukreet', 'Ghatpaat Closing',
    'Safety Exit Door/Discipline', 'Nandi', 'Nandi Set-up', 'Nandi Centre',
    'Nandi Trolley', 'Nandi Distribution', 'Chai Station', 'Chai Station Pack-up',
    'Nandi Line', 'Nandi Passing',
  ],
  chandraat: [
    'Nandi Labelling', 'Number 1', 'Prayer Hall Entrance', 'Shoe Entrance',
    'Seating & Discipline', 'Sukreet', 'Ghatpaat Closing',
    'Safety Exit Door/Discipline', 'Nandi', 'Nandi Set-up', 'Nandi Centre',
    'Nandi Trolley', 'Nandi Distribution', 'Water Station', 'Chai Station',
    'Chai Station Pack-up', 'Nandi Line', 'Nandi Passing',
  ],
  baithulkhayal: [
    'Nandi Labelling', 'Number 1', 'Prayer Hall Entrance', 'Shoe Entrance',
    'Seating & Discipline', 'Safety Exit Door/Discipline', 'Nandi',
    'Nandi Set-up', 'Nandi Centre', 'Nandi Trolley', 'Nandi Distribution',
    'Nandi Line', 'Nandi Passing',
  ],
  paanch: [
    'Nandi Labelling', 'Number 1', 'Shoe Entrance', 'Prayer Hall Entrance',
    'Seating & Discipline', 'Sukreet', 'Ghatpaat Closing',
    'Safety Exit Door/Discipline', 'Nandi', 'Nandi Set-up', 'Nandi Centre',
    'Nandi Trolley', 'Nandi Distribution', 'Nandi Line', 'Nandi Passing',
  ],
  student: [
    'Nandi Labelling', 'Number 1', 'Shoe Entrance', 'Prayer Hall Entrance',
    'Seating & Discipline', 'Sukreet', 'Ghatpaat Closing',
    'Safety Exit Door/Discipline', 'Nandi', 'Nandi Set-up', 'Nandi Centre',
    'Nandi Trolley', 'Nandi Distribution', 'Nandi Line', 'Nandi Passing',
  ],
  eid: [
    'Nandi Labelling', 'Number 1', 'Shoe Entrance', 'Prayer Hall Entrance',
    'Seating & Discipline', 'Sukreet', 'Ghatpaat Closing',
    'Safety Exit Door/Discipline', 'Nandi', 'Nandi Set-up', 'Nandi Centre',
    'Nandi Trolley', 'Nandi Distribution', 'Nandi Line', 'Nandi Passing',
  ],
  navroz: [
    'Nandi Labelling', 'Number 1', 'Prayer Hall Entrance', 'Shoe Entrance',
    'Seating & Discipline', 'Sukreet', 'Ghatpaat Closing',
    'Safety Exit Door/Discipline', 'Nandi', 'Nandi Set-up', 'Nandi Centre',
    'Nandi Trolley', 'Nandi Distribution', 'Water Station', 'Nandi Line',
    'Nandi Passing',
  ],
};

// ─── Helper Functions ───

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function hasCongregation(ev: RosterEvent): boolean {
  if (typeof ev.congregation === 'boolean') return ev.congregation;
  if (ev.type === 'friday') return true;
  const notes = (ev.notes || '').toLowerCase();
  return notes.includes('congregation');
}

export function getEventPeriodKey(
  ev: RosterEvent,
  allEvents: RosterEvent[]
): string {
  const d = new Date(ev.dateRaw || ev.date);
  if (isNaN(d.getTime())) return 'unknown-period';

  const sortedEvents = [...allEvents]
    .map((e) => ({ event: e, date: startOfDay(new Date(e.dateRaw || e.date)) }))
    .filter((e) => !isNaN(e.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let cycleStart: Date | null = null;
  for (const item of sortedEvents) {
    if (item.date <= startOfDay(d) && item.event.type === 'chandraat') {
      cycleStart = item.date;
    }
  }
  if (cycleStart) {
    return `duty-cycle-${cycleStart.getFullYear()}-${String(cycleStart.getMonth() + 1).padStart(2, '0')}-${String(cycleStart.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Duty Assignment Config ───

type AssignerFn = (
  type: EventType,
  members: {
    mA: Member[];
    mY: Member[];
    mC: Member[];
    mN: Member[];
    fA: Member[];
    fY: Member[];
    fC: Member[];
    fN: Member[];
    used: Set<string>;
  },
  pick: (
    pool: Member[],
    count: number,
    duty: string,
    allowFallback?: boolean,
    ignoreUsed?: boolean
  ) => string[]
) => { male: string[]; female: string[] };

const DUTY_ASSIGNMENT_CONFIG: Record<string, AssignerFn> = {
  'Nandi Labelling': (_type, members, pick) => {
    const { mA, mY, fA, fY } = members;
    if (Math.random() < 0.5 && fY.length) {
      return {
        male: [],
        female: [
          ...pick(fA, 1, 'Nandi Labelling', true),
          ...pick(fY, 1, 'Nandi Labelling', true, true),
        ],
      };
    }
    if (Math.random() < 0.5 && mA.length && fY.length) {
      return {
        male: pick(mA, 1, 'Nandi Labelling', true),
        female: pick(fY, 1, 'Nandi Labelling', true, true),
      };
    }
    if (mY.length && fA.length) {
      return {
        male: pick(mY, 1, 'Nandi Labelling', true, true),
        female: pick(fA, 1, 'Nandi Labelling', true),
      };
    }
    return {
      male: [],
      female: [
        ...pick(fA, 1, 'Nandi Labelling', true),
        ...pick(fY, 1, 'Nandi Labelling', true, true),
      ],
    };
  },

  'Number 1': (_type, members, pick) => ({
    male: pick([...members.mA, ...members.mY], 1, 'Number 1'),
    female: pick([...members.fA, ...members.fY], 1, 'Number 1'),
  }),

  'Prayer Hall Entrance': (_type, members, pick) => ({
    male: pick(
      members.mC.length >= 2
        ? members.mC
        : [...members.mC, ...members.mY],
      2,
      'Prayer Hall Entrance'
    ),
    female: pick(
      members.fC.length >= 2
        ? members.fC
        : [...members.fC, ...members.fY],
      2,
      'Prayer Hall Entrance'
    ),
  }),

  'Shoe Entrance': (_type, members, pick) => ({
    male: pick(
      members.mY.length ? members.mY : [...members.mY, ...members.mA],
      1,
      'Shoe Entrance'
    ),
    female: pick(
      members.fY.length ? members.fY : [...members.fY, ...members.fA],
      1,
      'Shoe Entrance'
    ),
  }),

  'Seating & Discipline': (_type, members, pick) => ({
    male: [
      ...pick(members.mA, 1, 'Seating & Discipline'),
      ...pick(members.mY, 1, 'Seating & Discipline'),
    ].filter(Boolean),
    female: [
      ...pick(members.fA, 1, 'Seating & Discipline'),
      ...pick(members.fY, 1, 'Seating & Discipline'),
    ].filter(Boolean),
  }),

  'Sukreet': (_type, members, pick) => ({
    male:
      members.mY.length && Math.random() < 0.6
        ? [
            ...pick(members.mA, 1, 'Sukreet'),
            ...pick(members.mY, 1, 'Sukreet'),
          ].filter(Boolean)
        : pick(members.mA, 2, 'Sukreet'),
    female:
      members.fY.length && Math.random() < 0.6
        ? [
            ...pick(members.fA, 1, 'Sukreet'),
            ...pick(members.fY, 1, 'Sukreet'),
          ].filter(Boolean)
        : pick(members.fA, 2, 'Sukreet'),
  }),

  'Ghatpaat Closing': (_type, members, pick) => ({
    male: pick(
      members.mY.length ? members.mY : members.mA,
      1,
      'Ghatpaat Closing'
    ),
    female: pick(
      members.fY.length ? members.fY : members.fA,
      1,
      'Ghatpaat Closing'
    ),
  }),

  'Safety Exit Door/Discipline': (_type, members, pick) => ({
    male: [],
    female:
      Math.random() < 0.5 && members.fY.length
        ? [
            ...pick(members.fA, 1, 'Safety Exit Door/Discipline'),
            ...pick(members.fY, 1, 'Safety Exit Door/Discipline'),
          ].filter(Boolean)
        : pick(members.fA, 1, 'Safety Exit Door/Discipline'),
  }),

  Nandi: (_type, members, pick) => {
    const c = Math.floor(Math.random() * 3);
    if (c === 0 && members.mN.length >= 2)
      return { male: pick(members.mN, 2, 'Nandi'), female: [] };
    if (c === 1 && members.fN.length >= 2)
      return { male: [], female: pick(members.fN, 2, 'Nandi') };
    return {
      male: pick(members.mN, 1, 'Nandi'),
      female: pick(members.fN, 1, 'Nandi'),
    };
  },

  'Nandi Set-up': (_type, members, pick) => ({
    male: pick([...members.mA, ...members.mY], 1, 'Nandi Set-up'),
    female: pick([...members.fA, ...members.fY], 1, 'Nandi Set-up'),
  }),

  'Nandi Centre': (_type, members, pick) =>
    Math.random() < 0.5
      ? {
          male: pick([...members.mA, ...members.mY], 1, 'Nandi Centre'),
          female: [],
        }
      : {
          male: [],
          female: pick([...members.fA, ...members.fY], 1, 'Nandi Centre'),
        },

  'Nandi Trolley': (_type, members, pick) =>
    Math.random() < 0.5
      ? {
          male: pick([...members.mA, ...members.mY], 1, 'Nandi Trolley'),
          female: [],
        }
      : {
          male: [],
          female: pick([...members.fA, ...members.fY], 1, 'Nandi Trolley'),
        },

  'Nandi Line': (_type, members, pick) => {
    const umA = members.mA.filter((m) => !members.used.has(m.name));
    const ufA = members.fA.filter((m) => !members.used.has(m.name));
    const umY = members.mY.filter((m) => !members.used.has(m.name));
    const ufY = members.fY.filter((m) => !members.used.has(m.name));
    const malePool = [...umA, ...umY, ...members.mA, ...members.mY].filter(
      (m, i, a) => a.findIndex((x) => x.name === m.name) === i
    );
    const femalePool = [...ufA, ...ufY, ...members.fA, ...members.fY].filter(
      (m, i, a) => a.findIndex((x) => x.name === m.name) === i
    );
    return {
      male: pick(
        malePool,
        Math.min(Math.max(4, umA.length + Math.min(umY.length, 2)), 10),
        'Nandi Line'
      ),
      female: pick(
        femalePool,
        Math.min(Math.max(4, ufA.length + Math.min(ufY.length, 2)), 10),
        'Nandi Line'
      ),
    };
  },

  'Nandi Passing': (_type, members, pick) => {
    const ucM = members.mC.filter((m) => !members.used.has(m.name));
    const ucF = members.fC.filter((m) => !members.used.has(m.name));
    const uyM = members.mY.filter((m) => !members.used.has(m.name));
    const uyF = members.fY.filter((m) => !members.used.has(m.name));
    const malePool = [
      ...ucM, ...uyM, ...members.mC, ...members.mY, ...members.mA,
    ].filter((m, i, a) => a.findIndex((x) => x.name === m.name) === i);
    const femalePool = [
      ...ucF, ...uyF, ...members.fC, ...members.fY, ...members.fA,
    ].filter((m, i, a) => a.findIndex((x) => x.name === m.name) === i);
    return {
      male: pick(
        malePool,
        Math.min(Math.max(3, ucM.length + Math.min(uyM.length, 1)), 8),
        'Nandi Passing'
      ),
      female: pick(
        femalePool,
        Math.min(Math.max(3, ucF.length + Math.min(uyF.length, 1)), 8),
        'Nandi Passing'
      ),
    };
  },

  'Nandi Distribution': (_type, members, pick) => ({
    male: [
      pick(members.mA, 1, 'Nandi Distribution')[0] ||
        pick(members.mY, 1, 'Nandi Distribution')[0],
    ].filter(Boolean),
    female: pick(
      [...members.fA, ...members.fY],
      1,
      'Nandi Distribution'
    ),
  }),

  'Chai Station': (_type, members, pick) => ({
    male: pick(members.mA, Math.random() < 0.5 ? 1 : 2, 'Chai Station'),
    female: pick(members.fA, Math.random() < 0.5 ? 0 : 1, 'Chai Station'),
  }),

  'Water Station': (_type, members, pick) => ({
    male: pick([...members.mA, ...members.mY], 1, 'Water Station'),
    female: pick([...members.fA, ...members.fY], 1, 'Water Station'),
  }),

  'Chai Station Pack-up': (_type, members, pick) => {
    const male = pick(members.mA, 1, 'Chai Station Pack-up', true, true);
    const youth =
      Math.random() < 0.5
        ? pick(members.mY, 1, 'Chai Station Pack-up', true, true)
        : [];
    const femaleYouth = youth.length
      ? []
      : pick(members.fY, 1, 'Chai Station Pack-up', true, true);
    return { male: [...male, ...youth], female: femaleYouth };
  },
};

// ─── Main Generation Function ───

export interface GenerationContext {
  dutyCounts: DutyHistory;
  prevAssign: PrevAssignments;
  allEvents: RosterEvent[];
}

/**
 * Generate a roster for a single event.
 * MUTATES dutyCounts and prevAssign in the context for sequential fairness tracking.
 */
export function generateRoster(
  ev: RosterEvent,
  members: MembersData,
  context: GenerationContext
): DutyRow[] {
  const { dutyCounts, prevAssign, allEvents } = context;
  const type = ev.type;
  const dutyList = (DUTIES[type] || DUTIES.paanch).filter(
    (d) => !(d === 'Chai Station' && !HAS_CHAI.has(type))
  );

  const mA = members.male.filter((m) => isAdult(m) && isActive(m));
  const mY = members.male.filter((m) => isYouth(m) && isActive(m));
  const mC = members.male.filter((m) => isChild(m) && isActive(m));
  const fA = members.female.filter((m) => isAdult(m) && isActive(m));
  const fY = members.female.filter((m) => isYouth(m) && isActive(m));
  const fC = members.female.filter((m) => isChild(m) && isActive(m));
  const mN = mA.filter((m) => m.nandi);
  const fN = fA.filter((m) => m.nandi);

  const period = getEventPeriodKey(ev, allEvents);
  const used = new Set<string>();
  const roster: DutyRow[] = [];

  function pick(
    pool: Member[],
    count: number,
    duty: string,
    allowFallback = false,
    ignoreUsed = false
  ): string[] {
    if (count <= 0 || !pool.length) return [];
    const baseAvailable = ignoreUsed
      ? pool
      : pool.filter((m) => !used.has(m.name));
    const available = baseAvailable.filter((m) => {
      if (REPEAT_ALLOWED_DUTIES.has(duty)) return true;
      const hist = prevAssign[m.name] || [];
      return !hist.some(
        (x) => x.duty === duty && x.period === period && x.ev !== ev.id
      );
    });
    const finalPool = available.length
      ? available
      : allowFallback || HARD_REQUIRED_DUTIES.has(duty)
        ? baseAvailable
        : available;
    if (!finalPool.length) return [];
    const had = new Set(
      Object.entries(prevAssign)
        .filter(([, h]) =>
          h.some((x) => x.duty === duty && x.ev !== ev.id)
        )
        .map(([n]) => n)
    );
    return [...finalPool]
      .sort((a, b) => {
        const ah = had.has(a.name) ? 1 : 0;
        const bh = had.has(b.name) ? 1 : 0;
        if (ah !== bh) return ah - bh;
        return (
          ((dutyCounts[a.name] || 0) - (dutyCounts[b.name] || 0)) ||
          Math.random() - 0.5
        );
      })
      .slice(0, count)
      .map((m) => m.name);
  }

  function row(duty: string, mNames: string[], fNames: string[], section: 'adults' | 'youth' = 'adults') {
    [...mNames, ...fNames].forEach((n) => {
      dutyCounts[n] = (dutyCounts[n] || 0) + 1;
      if (!prevAssign[n]) prevAssign[n] = [];
      prevAssign[n].push({ duty, ev: ev.id, period });
      used.add(n);
    });
    roster.push({
      duty,
      male: mNames,
      female: fNames,
      isNandi: duty === 'Nandi',
      section,
    });
  }

  // Process main duties
  for (const d of dutyList) {
    const assigner = DUTY_ASSIGNMENT_CONFIG[d];
    if (assigner) {
      const assignments = assigner(type, { mA, mY, mC, mN, fA, fY, fC, fN, used }, pick);
      row(d, assignments.male, assignments.female, 'adults');
    }
  }

  // Congregation youth duties
  if (hasCongregation(ev)) {
    for (const d of YOUTH_DUTIES) {
      let mNames: string[] = [];
      let fNames: string[] = [];
      if (d === 'MPH Hall Entrance') {
        mNames = pick(mC.length ? mC : mY, 1, d, true, true);
        fNames = pick(fC.length ? fC : fY, 1, d, true, true);
      } else if (d === 'Seating & Discipline') {
        mNames = pick(mY, 1, d, true, true);
        fNames = pick(fY, 1, d, true, true);
      } else if (d === 'Sukreet') {
        mNames = pick(
          [...mY, ...mC.filter((m) => m.age >= 8)],
          2,
          d,
          true,
          true
        );
        fNames = pick(
          [...fY, ...fC.filter((m) => m.age >= 8)],
          2,
          d,
          true,
          true
        );
      } else if (d === 'MPH Paat Windup') {
        mNames = pick(mA, 2, d);
        fNames = [];
      }
      row(d, mNames, fNames, 'youth');
    }
  }

  return roster;
}

/**
 * Generate rosters for all events in a cycle sequentially.
 * Returns a map of eventId → DutyRow[].
 */
export function generateAllForCycle(
  events: RosterEvent[],
  members: MembersData,
  existingContext?: GenerationContext
): Record<string, DutyRow[]> {
  const context: GenerationContext = existingContext || {
    dutyCounts: {},
    prevAssign: {},
    allEvents: events,
  };

  // Initialize duty counts for all members
  [...members.male, ...members.female].forEach((m) => {
    if (!(m.name in context.dutyCounts)) {
      context.dutyCounts[m.name] = 0;
    }
  });

  const result: Record<string, DutyRow[]> = {};

  for (const ev of events) {
    if (!ev.locked) {
      result[ev.id] = generateRoster(ev, members, context);
    }
  }

  return result;
}
