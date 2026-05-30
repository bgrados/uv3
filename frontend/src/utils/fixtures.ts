// UV3 Platform — Automatic Fixture Generation Engine
// Pure TypeScript algorithms for league, knockout, and group formats

import type { MatchInput } from '@/types';

interface SlotConfig {
  dayOfWeek: number;
  startTime: string;
  venueId: string | null;
}

// ─────────────────────────────────────────────────────────────────
// LEAGUE FORMAT — Round Robin (Circle Method)
// ─────────────────────────────────────────────────────────────────
export function generateLeagueFixture(
  teamIds: string[],
  tournamentId: string,
  startDate: Date,
  slots: SlotConfig[]
): MatchInput[] {
  const teams = [...teamIds];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) teams.push('BYE');

  const n = teams.length;
  const totalRounds = n - 1;
  const matchesPerRound = n / 2;
  const matches: MatchInput[] = [];

  // Circle method: fix team[0], rotate the rest
  const fixed = teams[0];
  const rotating = teams.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const roundMatches: Array<[string, string]> = [];

    // First match: fixed vs rotating[0]
    roundMatches.push([fixed, rotating[0]]);

    // Remaining matches: pair from outside in
    for (let i = 1; i < matchesPerRound; i++) {
      const home = rotating[i];
      const away = rotating[rotating.length - i];
      roundMatches.push([home, away]);
    }

    for (const [home, away] of roundMatches) {
      if (home === 'BYE' || away === 'BYE') continue; // Skip bye matches

      matches.push({
        tournament_id: tournamentId,
        home_team_id: home,
        away_team_id: away,
        venue_id: null,
        date_time: null,
        round: round + 1,
      });
    }

    // Rotate: move last element to front of rotating array
    rotating.unshift(rotating.pop()!);
  }

  return assignSchedules(matches, startDate, slots);
}

// ─────────────────────────────────────────────────────────────────
// KNOCKOUT FORMAT — Single Elimination Brackets
// ─────────────────────────────────────────────────────────────────
export function generateKnockoutFixture(
  teamIds: string[],
  tournamentId: string,
  startDate: Date,
  slots: SlotConfig[]
): MatchInput[] {
  const teams = [...teamIds];
  const matches: MatchInput[] = [];

  // Find next power of 2
  let bracketSize = 1;
  while (bracketSize < teams.length) bracketSize *= 2;

  // Seed the bracket — top seeds get byes
  const bracket: (string | null)[] = [];
  for (let i = 0; i < bracketSize; i++) {
    bracket.push(i < teams.length ? teams[i] : null);
  }

  // Generate first round matches
  let round = 1;
  let currentBracket = [...bracket];

  while (currentBracket.length > 1) {
    const nextBracket: (string | null)[] = [];

    for (let i = 0; i < currentBracket.length; i += 2) {
      const home = currentBracket[i];
      const away = currentBracket[i + 1];

      if (home && away) {
        matches.push({
          tournament_id: tournamentId,
          home_team_id: home,
          away_team_id: away,
          venue_id: null,
          date_time: null,
          round,
        });
        nextBracket.push(null); // Winner TBD
      } else if (home) {
        nextBracket.push(home); // Automatic pass (bye)
      } else if (away) {
        nextBracket.push(away); // Automatic pass (bye)
      } else {
        nextBracket.push(null);
      }
    }

    currentBracket = nextBracket;
    round++;
  }

  return assignSchedules(matches, startDate, slots);
}

// ─────────────────────────────────────────────────────────────────
// GROUP FORMAT — Groups + Round Robin within each group
// ─────────────────────────────────────────────────────────────────
export function generateGroupFixture(
  teamIds: string[],
  tournamentId: string,
  groupsCount: number,
  startDate: Date,
  slots: SlotConfig[]
): MatchInput[] {
  const teams = [...teamIds];
  const allMatches: MatchInput[] = [];

  // Distribute teams across groups
  const groups: string[][] = Array.from({ length: groupsCount }, () => []);
  teams.forEach((teamId, index) => {
    groups[index % groupsCount].push(teamId);
  });

  // Generate round-robin within each group
  let roundOffset = 0;
  for (const group of groups) {
    if (group.length < 2) continue;

    const groupMatches = generateLeagueFixture(group, tournamentId, startDate, slots);

    // Offset rounds to distinguish groups
    for (const match of groupMatches) {
      allMatches.push({
        ...match,
        round: match.round + roundOffset,
      });
    }

    const groupTeams = [...group];
    if (groupTeams.length % 2 !== 0) groupTeams.push('BYE');
    roundOffset += groupTeams.length - 1;
  }

  return assignSchedules(allMatches, startDate, slots);
}

// ─────────────────────────────────────────────────────────────────
// SCHEDULE ASSIGNMENT — Distributes matches across available slots
// ─────────────────────────────────────────────────────────────────
function assignSchedules(
  matches: MatchInput[],
  startDate: Date,
  slots: SlotConfig[]
): MatchInput[] {
  if (slots.length === 0) return matches;

  // Sort slots by day of week
  const sortedSlots = [...slots].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  let slotIndex = 0;
  const currentDate = new Date(startDate);

  // Find the first available slot on or after startDate
  function advanceToNextSlot() {
    const targetDay = sortedSlots[slotIndex % sortedSlots.length].dayOfWeek;
    let attempts = 0;
    while (currentDate.getDay() !== targetDay && attempts < 7) {
      currentDate.setDate(currentDate.getDate() + 1);
      attempts++;
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const slot = sortedSlots[slotIndex % sortedSlots.length];

    advanceToNextSlot();

    // Build ISO datetime
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateTimeStr = `${year}-${month}-${day}T${slot.startTime}:00`;

    matches[i].date_time = dateTimeStr;
    matches[i].venue_id = slot.venueId;

    slotIndex++;

    // If we've cycled through all slots for this day, move to next week
    if (slotIndex % sortedSlots.length === 0) {
      currentDate.setDate(currentDate.getDate() + 1); // Move past current day
    }
  }

  return matches;
}
