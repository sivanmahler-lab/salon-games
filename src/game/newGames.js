import { pickImposterWord, IMPOSTER_CATEGORIES, CUSTOM_CAT } from "../data/imposterWords";

/* ---------------------------------------------------------------------------
   Two party games added later: "המתחזה" (imposter) and Hebrew Boggle.
   Pure state helpers; the reducer in utils/roomSync.js calls them.
--------------------------------------------------------------------------- */

const shuffleArr = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/* ---- Imposter ---- */
export function newImposterRound(room, prev = null) {
  const ids = room.players.map((p) => p.id);
  const custom = room.impWords || [];
  const { cat, word } = pickImposterWord(prev?.word, custom);
  const imposterId = ids[Math.floor(Math.random() * ids.length)];
  const pool = cat === CUSTOM_CAT ? custom : IMPOSTER_CATEGORIES.find((c) => c.cat === cat).words;
  const options = shuffleArr([word, ...shuffleArr(pool.filter((w) => w !== word)).slice(0, 7)]);
  return {
    phase: "reveal", // reveal (phones show the role) -> talk -> vote -> guess (if caught) -> result
    cat, word, imposterId, options,
    order: shuffleArr(ids), // who gives the first hint, and so on
    seen: {}, votes: {}, caught: false, guess: null, gains: {}, round: (prev?.round || 0) + 1,
  };
}

export function imposterTally(players, votes) {
  const t = {};
  players.forEach((p) => { t[p.id] = 0; });
  Object.values(votes).forEach((id) => { if (id in t) t[id] += 1; });
  return t;
}

// The imposter is "caught" when the single most-voted player is the imposter.
export function imposterToGuessOrResult(room) {
  const I = room.imposter;
  const tally = imposterTally(room.players, I.votes);
  const max = Math.max(0, ...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max && max > 0);
  const caught = top.length === 1 && top[0] === I.imposterId;
  if (caught) return { ...room, imposter: { ...I, phase: "guess", caught: true } };
  return imposterFinish({ ...room, imposter: { ...I, caught: false } });
}

export function imposterFinish(room, guess = null) {
  const I = room.imposter;
  const gains = {};
  room.players.forEach((p) => { gains[p.id] = 0; });
  if (!I.caught) {
    gains[I.imposterId] = 3;
  } else {
    Object.entries(I.votes).forEach(([voter, target]) => { if (target === I.imposterId && voter in gains) gains[voter] += 1; });
    if (guess && guess === I.word && I.imposterId in gains) gains[I.imposterId] += 2;
  }
  const players = room.players.map((p) => ({ ...p, score: p.score + (gains[p.id] || 0) }));
  return { ...room, players, imposter: { ...I, phase: "result", guess, gains } };
}

/* ---- Boggle ---- */
export const BOGGLE_SECONDS = 120;
// Weighted by how often each letter appears in Hebrew words (final forms are shown as regular letters).
const LETTER_WEIGHTS = { "ו": 10, "י": 11, "ה": 9, "א": 8, "ל": 8, "ר": 7, "ת": 7, "מ": 7, "ב": 6, "ש": 6, "נ": 5, "ע": 5, "ד": 4, "כ": 4, "ח": 3, "ק": 3, "פ": 3, "צ": 2, "ס": 2, "ג": 2, "ז": 2, "ט": 2 };
const SOFIT = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
export const normHeb = (s) => String(s || "").replace(/[ךםןףץ]/g, (c) => SOFIT[c]).replace(/[^א-ת]/g, "");

export function buildBoggleBoard() {
  const bag = Object.entries(LETTER_WEIGHTS).flatMap(([l, n]) => Array(n).fill(l));
  for (let tries = 0; tries < 50; tries++) {
    const b = Array.from({ length: 16 }, () => bag[Math.floor(Math.random() * bag.length)]);
    const soft = b.filter((l) => "אהוי".includes(l)).length;
    if (soft >= 5 && soft <= 9) return b;
  }
  return Array.from({ length: 16 }, () => bag[Math.floor(Math.random() * bag.length)]);
}

// Can the word be traced on the 4x4 board through neighbouring cells, using each cell once?
export function wordOnBoard(board, word) {
  const w = [...normHeb(word)];
  if (w.length < 3) return false;
  const used = Array(16).fill(false);
  const go = (i, k) => {
    if (board[i] !== w[k]) return false;
    if (k === w.length - 1) return true;
    used[i] = true;
    const r = Math.floor(i / 4), c = i % 4;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr > 3 || cc < 0 || cc > 3) continue;
      const j = rr * 4 + cc;
      if (!used[j] && go(j, k + 1)) { used[i] = false; return true; }
    }
    used[i] = false;
    return false;
  };
  return board.some((_, i) => go(i, 0));
}

export const wordPoints = (w) => { const n = [...w].length; return n < 3 ? 0 : n <= 4 ? 1 : n === 5 ? 2 : n === 6 ? 3 : n === 7 ? 5 : 11; };

export function newBoggleRound(prev = null) {
  return { phase: "ready", board: buildBoggleBoard(), timeLeft: BOGGLE_SECONDS, words: {}, removed: [], gains: {}, round: (prev?.round || 0) + 1 };
}

// word -> list of player ids who found it
export function boggleIndex(B) {
  const idx = {};
  Object.entries(B.words).forEach(([id, ws]) => ws.forEach((w) => { (idx[w] = idx[w] || []).push(id); }));
  return idx;
}

export function boggleScores(B) {
  const idx = boggleIndex(B);
  const gains = {};
  Object.keys(B.words).forEach((id) => { gains[id] = 0; });
  Object.entries(idx).forEach(([w, ids]) => {
    if (ids.length > 1 || B.removed.includes(w)) return; // shared words are struck, doubtful ones deleted by the host
    gains[ids[0]] += wordPoints(w);
  });
  return gains;
}
