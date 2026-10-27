/* Alias, one phone in the middle of the room. Pure rules, no screens. */

export const ALIAS_TIMES = [30, 45, 60, 90];
export const ALIAS_TARGETS = [15, 30, 50];

export function newAliasTeams(count = 2) {
  return Array.from({ length: count }, (_, i) => ({ name: `קבוצה ${i + 1}`, score: 0 }));
}

// Points for one finished turn: +1 for each guessed word. With the penalty option on,
// a word that was skipped on purpose costs a point; a word cut off by the clock costs nothing.
export function aliasDelta(log, penalty) {
  return log.reduce((sum, x) => sum + (x.ok ? 1 : penalty && !x.timeout ? -1 : 0), 0);
}

// Tapping a word in the review list flips it. A word flipped to "guessed" is no longer a timeout.
export function flipAliasWord(log, i) {
  return log.map((x, idx) => {
    if (idx !== i) return x;
    const ok = !x.ok;
    return { ...x, ok, timeout: ok ? false : x.timeout };
  });
}

// After the review: add the points, pass the turn on, and decide whether the game is over.
// The game can only end after every team has played the same number of turns, and only
// when exactly one team is on top and has reached the target.
export function finishAliasTurn({ teams, turn, played, log, penalty, target }) {
  const nextTeams = teams.map((t, i) => (i === turn ? { ...t, score: t.score + aliasDelta(log, penalty) } : t));
  const nextTurn = (turn + 1) % nextTeams.length;
  const nextPlayed = played + 1;
  let stage = "ready";
  if (nextPlayed % nextTeams.length === 0) {
    const top = Math.max(...nextTeams.map((t) => t.score));
    if (top >= target && nextTeams.filter((t) => t.score === top).length === 1) stage = "end";
  }
  return { teams: nextTeams, turn: nextTurn, played: nextPlayed, stage };
}
