/**
 * Classic Couch to 5K program (Cool Running)
 * Each workout: 5-min warmup walk, intervals, 5-min cooldown walk
 * Intervals are { type: 'run'|'walk', seconds: number }
 */

export const WARMUP_SECONDS = 5 * 60;
export const COOLDOWN_SECONDS = 5 * 60;

export const PROGRAM = [
  // Week 1
  {
    week: 1,
    day: 1,
    label: 'Week 1 · Day 1',
    description: '60s run / 90s walk × 8',
    intervals: repeatIntervals([
      { type: 'run', seconds: 60 },
      { type: 'walk', seconds: 90 },
    ], 8),
  },
  {
    week: 1,
    day: 2,
    label: 'Week 1 · Day 2',
    description: '60s run / 90s walk × 8',
    intervals: repeatIntervals([
      { type: 'run', seconds: 60 },
      { type: 'walk', seconds: 90 },
    ], 8),
  },
  {
    week: 1,
    day: 3,
    label: 'Week 1 · Day 3',
    description: '60s run / 90s walk × 8',
    intervals: repeatIntervals([
      { type: 'run', seconds: 60 },
      { type: 'walk', seconds: 90 },
    ], 8),
  },
  // Week 2
  {
    week: 2,
    day: 1,
    label: 'Week 2 · Day 1',
    description: '90s run / 2 min walk × 6',
    intervals: repeatIntervals([
      { type: 'run', seconds: 90 },
      { type: 'walk', seconds: 120 },
    ], 6),
  },
  {
    week: 2,
    day: 2,
    label: 'Week 2 · Day 2',
    description: '90s run / 2 min walk × 6',
    intervals: repeatIntervals([
      { type: 'run', seconds: 90 },
      { type: 'walk', seconds: 120 },
    ], 6),
  },
  {
    week: 2,
    day: 3,
    label: 'Week 2 · Day 3',
    description: '90s run / 2 min walk × 6',
    intervals: repeatIntervals([
      { type: 'run', seconds: 90 },
      { type: 'walk', seconds: 120 },
    ], 6),
  },
  // Week 3
  {
    week: 3,
    day: 1,
    label: 'Week 3 · Day 1',
    description: '90s run, 90s walk, 3 min run, 3 min walk × 2',
    intervals: repeatIntervals([
      { type: 'run', seconds: 90 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 180 },
    ], 2),
  },
  {
    week: 3,
    day: 2,
    label: 'Week 3 · Day 2',
    description: '90s run, 90s walk, 3 min run, 3 min walk × 2',
    intervals: repeatIntervals([
      { type: 'run', seconds: 90 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 180 },
    ], 2),
  },
  {
    week: 3,
    day: 3,
    label: 'Week 3 · Day 3',
    description: '90s run, 90s walk, 3 min run, 3 min walk × 2',
    intervals: repeatIntervals([
      { type: 'run', seconds: 90 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 180 },
    ], 2),
  },
  // Week 4
  {
    week: 4,
    day: 1,
    label: 'Week 4 · Day 1',
    description: '3 min run, 90s walk, 5 min run, 2.5 min walk, 3 min run, 90s walk, 5 min run',
    intervals: [
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 300 },
      { type: 'walk', seconds: 150 },
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 300 },
    ],
  },
  {
    week: 4,
    day: 2,
    label: 'Week 4 · Day 2',
    description: '3 min run, 90s walk, 5 min run, 2.5 min walk, 3 min run, 90s walk, 5 min run',
    intervals: [
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 300 },
      { type: 'walk', seconds: 150 },
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 300 },
    ],
  },
  {
    week: 4,
    day: 3,
    label: 'Week 4 · Day 3',
    description: '3 min run, 90s walk, 5 min run, 2.5 min walk, 3 min run, 90s walk, 5 min run',
    intervals: [
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 300 },
      { type: 'walk', seconds: 150 },
      { type: 'run', seconds: 180 },
      { type: 'walk', seconds: 90 },
      { type: 'run', seconds: 300 },
    ],
  },
  // Week 5
  {
    week: 5,
    day: 1,
    label: 'Week 5 · Day 1',
    description: '5 min run / 3 min walk × 3',
    intervals: repeatIntervals([
      { type: 'run', seconds: 300 },
      { type: 'walk', seconds: 180 },
    ], 3),
  },
  {
    week: 5,
    day: 2,
    label: 'Week 5 · Day 2',
    description: '8 min run / 5 min walk × 2',
    intervals: repeatIntervals([
      { type: 'run', seconds: 480 },
      { type: 'walk', seconds: 300 },
    ], 2),
  },
  {
    week: 5,
    day: 3,
    label: 'Week 5 · Day 3',
    description: '20 min continuous run',
    intervals: [{ type: 'run', seconds: 1200 }],
  },
  // Week 6
  {
    week: 6,
    day: 1,
    label: 'Week 6 · Day 1',
    description: '5 min run, 3 min walk, 8 min run, 3 min walk, 5 min run',
    intervals: [
      { type: 'run', seconds: 300 },
      { type: 'walk', seconds: 180 },
      { type: 'run', seconds: 480 },
      { type: 'walk', seconds: 180 },
      { type: 'run', seconds: 300 },
    ],
  },
  {
    week: 6,
    day: 2,
    label: 'Week 6 · Day 2',
    description: '10 min run / 3 min walk × 2',
    intervals: repeatIntervals([
      { type: 'run', seconds: 600 },
      { type: 'walk', seconds: 180 },
    ], 2),
  },
  {
    week: 6,
    day: 3,
    label: 'Week 6 · Day 3',
    description: '25 min continuous run',
    intervals: [{ type: 'run', seconds: 1500 }],
  },
  // Week 7
  {
    week: 7,
    day: 1,
    label: 'Week 7 · Day 1',
    description: '25 min continuous run',
    intervals: [{ type: 'run', seconds: 1500 }],
  },
  {
    week: 7,
    day: 2,
    label: 'Week 7 · Day 2',
    description: '25 min continuous run',
    intervals: [{ type: 'run', seconds: 1500 }],
  },
  {
    week: 7,
    day: 3,
    label: 'Week 7 · Day 3',
    description: '25 min continuous run',
    intervals: [{ type: 'run', seconds: 1500 }],
  },
  // Week 8
  {
    week: 8,
    day: 1,
    label: 'Week 8 · Day 1',
    description: '28 min continuous run',
    intervals: [{ type: 'run', seconds: 1680 }],
  },
  {
    week: 8,
    day: 2,
    label: 'Week 8 · Day 2',
    description: '28 min continuous run',
    intervals: [{ type: 'run', seconds: 1680 }],
  },
  {
    week: 8,
    day: 3,
    label: 'Week 8 · Day 3',
    description: '28 min continuous run',
    intervals: [{ type: 'run', seconds: 1680 }],
  },
  // Week 9
  {
    week: 9,
    day: 1,
    label: 'Week 9 · Day 1',
    description: '30 min continuous run — you did it!',
    intervals: [{ type: 'run', seconds: 1800 }],
  },
  {
    week: 9,
    day: 2,
    label: 'Week 9 · Day 2',
    description: '30 min continuous run',
    intervals: [{ type: 'run', seconds: 1800 }],
  },
  {
    week: 9,
    day: 3,
    label: 'Week 9 · Day 3',
    description: '30 min continuous run — graduation!',
    intervals: [{ type: 'run', seconds: 1800 }],
  },
];

function repeatIntervals(pattern, times) {
  const result = [];
  for (let i = 0; i < times; i++) {
    result.push(...pattern);
  }
  return result;
}

export function getWorkoutTotalSeconds(workout) {
  return WARMUP_SECONDS + workout.intervals.reduce((sum, i) => sum + i.seconds, 0) + COOLDOWN_SECONDS;
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getWorkoutById(week, day) {
  return PROGRAM.find((w) => w.week === week && w.day === day);
}

export function getNextWorkout(completedIds) {
  return PROGRAM.find((w) => !completedIds.includes(workoutId(w))) ?? null;
}

export function workoutId(workout) {
  return `w${workout.week}d${workout.day}`;
}
