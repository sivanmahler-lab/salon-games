import { createClient } from "@supabase/supabase-js";
import { GAME_DEFS } from "../constants/theme";
import { shuffle, buildCharacters, buildShrinkRule, buildAliasDeck } from "../data/datasets";
import { LEXICON } from "../data/lexicon";
import { newImposterRound, imposterToGuessOrResult, imposterFinish, newBoggleRound, wordOnBoard, normHeb, boggleScores, BOGGLE_SECONDS } from "../game/newGames";

/* ----------------------------------------------------------------------------
   ROOM SYNC ADAPTER
   ----------------------------------------------------------------------------
   Every device in the room needs to see the same live game state. This adapter
   is the ONLY place that touches the transport — every component talks to it
   through send() / subscribe() / close(), never directly.

   Live implementation: Supabase Realtime. This DOES work across separate
   physical devices (phones, laptops, anything) on any network — the room's
   messages are relayed through your Supabase project, not the local browser.

   The anon/publishable key below is meant to be public — it's safe to ship in
   client-side code. It only grants what your project's Realtime/RLS settings
   allow, not admin access. Never put a secret/service_role key here.
---------------------------------------------------------------------------- */

const SUPABASE_URL = "https://sshfawsafagentkefere.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_alsSqoA6sGOTUzG7HRCwqA_9MVgNxpK";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function createRoomChannel(roomCode) {
  const channel = supabase.channel(`salon-room-${roomCode}`, { config: { broadcast: { self: false } } });
  let ready = false;
  const queue = [];
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      ready = true;
      queue.forEach((m) => channel.send(m));
      queue.length = 0;
    }
  });
  const post = (msg) => {
    const payload = { type: "broadcast", event: "state", payload: msg };
    if (ready) channel.send(payload);
    else queue.push(payload);
  };
  return {
    send: post,
    subscribe: (cb) => {
      channel.on("broadcast", { event: "state" }, ({ payload }) => cb(payload));
      return () => supabase.removeChannel(channel);
    },
    close: () => supabase.removeChannel(channel),
  };
}

/* ---- BroadcastChannel fallback (local-only, same-browser testing) --------
   Kept here for offline dev when you don't want to hit the network at all —
   works only across tabs of the SAME browser, never across real devices.
   Swap this back in as createRoomChannel() if you ever need it.

function createRoomChannel(roomCode) {
  const bc = new BroadcastChannel(`salon-room-${roomCode}`);
  return {
    send: (msg) => bc.postMessage(msg),
    subscribe: (cb) => {
      const handler = (e) => cb(e.data);
      bc.addEventListener("message", handler);
      return () => bc.removeEventListener("message", handler);
    },
    close: () => bc.close(),
  };
}
------------------------------------------------------------------------- */

export function generateId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function generateRoomCode() {
  const letters = "אבגדהוזחטיכלמנסעפצקרשת";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${l1}${l2}${num}`;
}

// Room codes are compared after stripping spaces/dashes and normalizing case,
// so "צט 5837", "צט-5837", and "צט5837" all match the same room — forgiving
// of however someone happens to type or paste it.
export function normalizeRoomCode(code) {
  return (code || "").replace(/[\s-]/g, "").trim().toUpperCase();
}

/* ============================================================================
   ROOM STATE — host-authoritative reducer
   Host holds the one true `room` object and applies every action (its own UI
   actions AND actions relayed from players) through this reducer, then
   broadcasts the resulting snapshot. Players never run this reducer locally —
   they just render whatever snapshot they last received.
============================================================================ */

export function createInitialRoom() {
  return {
    screen: "lobby", // lobby | hub | whoami | shrink | alias | podium
    category: "friends",
    paused: false, // the host pressed PAUSE: the clock stops and every screen says so
    enabledGames: GAME_DEFS.map((g) => g.id),
    players: [],
    whoami: null,
    shrink: null,
    alias: null,
    lexicon: null,
    imposter: null,
    boggle: null,
  };
}

// Seconds per turn: "מי אני" gets a minute and a half, the explaining game keeps a minute.
const TURN_SECONDS = { whoami: 90, alias: 60 };
export const ALIAS_MAX_SOLO = 6;
function startTurnGameState(players, deck, seconds = 60) {
  return { deck, turnIdx: 0, cursor: 0, phase: "ready", timeLeft: seconds, correct: 0, skips: 0 };
}

/* ---- Lexicon (foreign word -> Hebrew meaning): each player invents a definition, everyone votes for the real one ---- */
// Every round opens with a check: anyone who already knows the word says so and the word is swapped for a new one.
// Only when everybody answers "I don't know it" does the writing start.
// `from` is the round being left: it is kept (without the deck) so the host can go back to that word.
function lexiconRound(deck, cursor, notice = null, from = null) {
  const c = cursor % deck.length;
  const prev = from ? { wordIdx: from.wordIdx, cursor: from.cursor, phase: from.phase, seen: from.seen, notice: from.notice, defs: from.defs, options: from.options, votes: from.votes, gains: from.gains } : null;
  return { deck, cursor: c, wordIdx: deck[c], phase: "check", seen: {}, notice, defs: {}, options: [], votes: {}, gains: {}, prev };
}
function lexiconToVote(room) {
  const L = room.lexicon;
  const real = LEXICON[L.wordIdx].d;
  const options = shuffle([
    { id: "real", text: real, owner: null },
    ...room.players.filter((p) => L.defs[p.id]).map((p) => ({ id: "p:" + p.id, text: L.defs[p.id], owner: p.id })),
  ]);
  return { ...room, lexicon: { ...L, phase: "vote", options, votes: {} } };
}
function lexiconReveal(room) {
  const L = room.lexicon;
  const gains = {};
  Object.entries(L.votes).forEach(([voter, optId]) => {
    const opt = L.options.find((o) => o.id === optId);
    if (!opt) return;
    if (opt.owner === null) gains[voter] = (gains[voter] || 0) + 1; // found the real meaning: one point
    else gains[opt.owner] = (gains[opt.owner] || 0) + 1; // fooled someone
  });
  const players = room.players.map((p) => {
    const gain = gains[p.id] || 0;
    const found = L.votes[p.id] === "real" ? 1 : 0;
    return gain || found ? { ...p, score: p.score + gain, correct: p.correct + found } : p;
  });
  return { ...room, players, lexicon: { ...L, phase: "result", gains } };
}

// Points of the turn in progress are banked when the turn ends (or is handed to someone else mid-way).
function bankTurn(room, key) {
  const g = room[key];
  const turnPlayer = room.players[g.turnIdx];
  if (!turnPlayer) return room.players;
  const solo = key === "alias" && g.mode === "solo";
  return room.players.map((p) => {
    if (solo) {
      const n = g.guessed?.[p.id] || 0; // solo alias: the points belong to the players who guessed
      const own = p.id === turnPlayer.id ? g.correct : 0; // the explainer also earns a point for every word guessed
      return { ...p, score: p.score + n + own, correct: p.correct + n + own, skips: p.skips + (p.id === turnPlayer.id ? g.skips : 0) };
    }
    return p.id === turnPlayer.id ? { ...p, score: p.score + g.correct, correct: p.correct + g.correct, skips: p.skips + g.skips } : p;
  });
}

// Takes a player out of the evening at any moment and keeps whatever game is running consistent.
function removePlayer(room, id) {
  const idx = room.players.findIndex((p) => p.id === id);
  const left = room.left?.includes(id) ? room.left : [...(room.left || []), id];
  if (idx < 0) return { ...room, left };
  let next = { ...room, left, players: room.players.filter((p) => p.id !== id) };
  const n = next.players.length;
  const inGame = ["whoami", "alias", "lexicon", "shrink", "imposter", "boggle"].includes(room.screen);
  if (inGame && n < 2) {
    return { ...next, screen: "hub", paused: false, whoami: null, shrink: null, alias: null, lexicon: null, imposter: null, boggle: null };
  }
  for (const key of ["whoami", "alias"]) {
    const g = next[key];
    if (!g || room.screen !== key) continue;
    if (idx < g.turnIdx) next = { ...next, [key]: { ...g, turnIdx: g.turnIdx - 1 } };
    else if (idx === g.turnIdx) next = { ...next, [key]: { ...g, turnIdx: g.turnIdx % n, phase: "ready", timeLeft: TURN_SECONDS[key], correct: 0, skips: 0, guessed: {}, won: null, cursor: (g.cursor + 1) % g.deck.length } };
  }
  const L = next.lexicon;
  if (L && room.screen === "lexicon" && L.phase !== "level" && L.phase !== "result") {
    const drop = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => k !== id));
    next = { ...next, lexicon: { ...L, seen: drop(L.seen), defs: drop(L.defs), votes: drop(L.votes) } };
    const L2 = next.lexicon;
    if (L2.phase === "check" && next.players.every((p) => L2.seen[p.id])) next = { ...next, lexicon: { ...L2, phase: "write", notice: null } };
    else if (L2.phase === "write" && Object.keys(L2.defs).length && next.players.every((p) => L2.defs[p.id])) next = lexiconToVote(next);
    else if (L2.phase === "vote" && next.players.every((p) => L2.votes[p.id] || !L2.options.some((o) => o.owner !== p.id))) next = lexiconReveal(next);
  }
  const I = next.imposter;
  if (I && room.screen === "imposter" && I.phase !== "result") {
    if (n < 3 || id === I.imposterId) {
      next = n < 3 ? { ...next, screen: "hub", imposter: null } : { ...next, imposter: { ...newImposterRound(next, I), round: I.round } }; // the imposter left: a fresh round
    } else {
      const drop = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k, v]) => k !== id && v !== id));
      next = { ...next, imposter: { ...I, seen: drop(I.seen), votes: drop(I.votes), order: I.order.filter((x) => x !== id) } };
      const I2 = next.imposter;
      if (I2.phase === "vote" && next.players.every((p) => I2.votes[p.id])) next = imposterToGuessOrResult(next);
    }
  }
  const B = next.boggle;
  if (B && room.screen === "boggle") {
    const words = Object.fromEntries(Object.entries(B.words).filter(([k]) => k !== id));
    next = { ...next, boggle: { ...B, words } };
  }
  const S = next.shrink;
  if (S && room.screen === "shrink" && S.psychId === id) next = { ...next, shrink: { phase: "select", psychId: next.players[0]?.id || null, rule: "", clues: 0, found: false, totalScore: 0 } };
  return next;
}

export function roomReducer(room, action) {
  switch (action.type) {
    case "JOIN": {
      if (room.players.some((p) => p.id === action.id) || room.left?.includes(action.id)) return room;
      // Someone joins with a name that is already in the room: this is the same person coming back after their phone
      // disconnected (new scan of the QR). They get their old seat back (score, turn, answers) instead of a second entry.
      const clean = (s) => String(s || "").trim();
      const seat = clean(action.name) && room.players.find((p) => clean(p.name) === clean(action.name));
      if (seat) {
        const moved = JSON.parse(JSON.stringify(room).split(seat.id).join(action.id));
        return { ...moved, left: [...(moved.left || []), seat.id] }; // the old connection, if it is still open somewhere, is closed
      }
      const player = { id: action.id, name: action.name, traits: action.traits || [], score: 0, correct: 0, skips: 0, diagnosed: 0 };
      return { ...room, players: [...room.players, player] };
    }
    case "LEAVE": // a player leaves (or the host removes someone), at any moment
      return removePlayer(room, action.id);
    case "SET_TURN": {
      // the host hands the turn to a specific player, at any moment (the points of the interrupted turn are kept)
      const key = action.game;
      const g = room[key];
      if (!g || room.screen !== key || !room.players[action.idx]) return room;
      const players = g.phase === "playing" || g.phase === "turnEnd" ? (g.phase === "playing" ? bankTurn(room, key) : room.players) : room.players;
      return { ...room, players, [key]: { ...g, turnIdx: action.idx, phase: "ready", timeLeft: TURN_SECONDS[key] || 60, correct: 0, skips: 0, guessed: {}, won: null, cursor: (g.cursor + 1) % g.deck.length } };
    }
    case "SET_CONFIG":
      return { ...room, ...action.patch };
    case "START_HUB":
      return room.players.length >= 2 ? { ...room, screen: "hub" } : room;
    case "BACK_TO_HUB":
      return { ...room, screen: "hub", paused: false };
    case "GO_PODIUM":
      return { ...room, screen: "podium", paused: false };
    case "BACK_TO_LOBBY": // from the games list back to the evening's settings (to add or remove games)
      return { ...room, screen: "lobby", paused: false };
    case "SET_IMP_WORDS": // the host's own secret words for "המתחזה" (one per line)
      return { ...room, impWords: (action.words || []).map((w) => String(w).trim()).filter(Boolean).slice(0, 60) };
    case "SET_PAUSED":
      return { ...room, paused: !!action.value };
    case "PLAY_AGAIN": {
      const players = room.players.map((p) => ({ ...p, score: 0, correct: 0, skips: 0, diagnosed: 0 }));
      return { ...room, players, screen: "hub", paused: false, whoami: null, shrink: null, alias: null, lexicon: null, imposter: null, boggle: null };
    }

    case "START_GAME": {
      room = { ...room, paused: false };
      if (action.game === "whoami") {
        return { ...room, screen: "whoami", whoami: startTurnGameState(room.players, buildCharacters(), TURN_SECONDS.whoami) };
      }
      if (action.game === "alias") {
        // Up to 6 players: points go to whoever guessed. More than that: two teams, points go to the explainer's team.
        const mode = room.players.length > ALIAS_MAX_SOLO ? "teams" : "solo";
        return { ...room, screen: "alias", alias: { ...startTurnGameState(room.players, shuffle(buildAliasDeck(room.players)), TURN_SECONDS.alias), mode, guessed: {} } };
      }
      if (action.game === "shrink") {
        if (room.players.length < 3) return room; // needs a psychologist and at least two others
        return { ...room, screen: "shrink", shrink: { phase: "select", psychId: null, rule: "", clues: 0, found: false, totalScore: 0 } };
      }
      if (action.game === "lexicon") {
        return { ...room, screen: "lexicon", lexicon: lexiconRound(shuffle(LEXICON.map((_, i) => i)), 0) }; // every word, no difficulty choice
      }
      if (action.game === "imposter") {
        return room.players.length >= 3 ? { ...room, screen: "imposter", imposter: newImposterRound(room) } : room;
      }
      if (action.game === "boggle") {
        return { ...room, screen: "boggle", boggle: newBoggleRound() };
      }
      return room;
    }

    /* ---- Imposter ---- */
    case "IMP_SEEN": {
      const I = room.imposter;
      if (!I || I.phase !== "reveal" || !room.players.some((p) => p.id === action.id)) return room;
      const seen = { ...I.seen, [action.id]: true };
      return { ...room, imposter: { ...I, seen, ...(room.players.every((p) => seen[p.id]) ? { phase: "talk" } : {}) } };
    }
    case "IMP_TO_TALK": {
      const I = room.imposter;
      return I && I.phase === "reveal" ? { ...room, imposter: { ...I, phase: "talk" } } : room;
    }
    case "IMP_TO_VOTE": {
      const I = room.imposter;
      return I && I.phase === "talk" ? { ...room, imposter: { ...I, phase: "vote", votes: {} } } : room;
    }
    case "IMP_VOTE": {
      const I = room.imposter;
      if (!I || I.phase !== "vote" || action.id === action.target) return room;
      if (!room.players.some((p) => p.id === action.id) || !room.players.some((p) => p.id === action.target)) return room;
      const votes = { ...I.votes, [action.id]: action.target };
      const next = { ...room, imposter: { ...I, votes } };
      return room.players.every((p) => votes[p.id]) ? imposterToGuessOrResult(next) : next;
    }
    case "IMP_REVEAL": {
      const I = room.imposter;
      return I && I.phase === "vote" ? imposterToGuessOrResult(room) : room;
    }
    case "IMP_GUESS": {
      const I = room.imposter;
      if (!I || I.phase !== "guess" || action.id !== I.imposterId) return room;
      return imposterFinish(room, action.word);
    }
    case "IMP_SKIP_GUESS": {
      const I = room.imposter;
      return I && I.phase === "guess" ? imposterFinish(room, "") : room;
    }
    case "IMP_NEXT": {
      const I = room.imposter;
      return I && I.phase === "result" && room.players.length >= 3 ? { ...room, imposter: newImposterRound(room, I) } : room;
    }

    /* ---- Boggle ---- */
    case "BOG_BEGIN": {
      const B = room.boggle;
      return B && B.phase === "ready" ? { ...room, boggle: { ...B, phase: "play", timeLeft: BOGGLE_SECONDS } } : room;
    }
    case "BOG_TICK": {
      const B = room.boggle;
      if (!B || B.phase !== "play" || room.paused) return room;
      const timeLeft = B.timeLeft - 1;
      return { ...room, boggle: timeLeft <= 0 ? { ...B, timeLeft: 0, phase: "review" } : { ...B, timeLeft } };
    }
    case "BOG_END": {
      const B = room.boggle;
      return B && B.phase === "play" ? { ...room, boggle: { ...B, timeLeft: 0, phase: "review" } } : room;
    }
    case "BOG_WORDS": {
      // the phone sends its whole list of words; only words that really sit on the board are kept
      const B = room.boggle;
      if (!B || B.phase !== "play" || !room.players.some((p) => p.id === action.id)) return room;
      const list = [...new Set((action.words || []).map(normHeb))].filter((w) => wordOnBoard(B.board, w)).slice(0, 200);
      return { ...room, boggle: { ...B, words: { ...B.words, [action.id]: list } } };
    }
    case "BOG_SHOW": { // review: whose words are open on the host screen (pressing the same name again closes them)
      const B = room.boggle;
      if (!B || B.phase !== "review") return room;
      return { ...room, boggle: { ...B, show: B.show === action.id ? null : action.id } };
    }
    case "BOG_TOGGLE": {
      const B = room.boggle;
      if (!B || B.phase !== "review") return room;
      const removed = B.removed.includes(action.word) ? B.removed.filter((w) => w !== action.word) : [...B.removed, action.word];
      return { ...room, boggle: { ...B, removed } };
    }
    case "BOG_FINISH": {
      const B = room.boggle;
      if (!B || B.phase !== "review") return room;
      const gains = boggleScores(B);
      const players = room.players.map((p) => ({ ...p, score: p.score + (gains[p.id] || 0) }));
      return { ...room, players, boggle: { ...B, phase: "result", gains } };
    }
    case "BOG_NEXT": {
      const B = room.boggle;
      return B && B.phase === "result" ? { ...room, boggle: newBoggleRound(B) } : room;
    }

    case "LEX_KNOW": {
      const L = room.lexicon;
      const me = room.players.find((p) => p.id === action.id);
      if (!L || L.phase !== "check" || !me) return room;
      if (action.known) {
        return { ...room, lexicon: lexiconRound(L.deck, L.cursor + 1, { word: LEXICON[L.wordIdx].w, by: me.name }, L) };
      }
      const seen = { ...L.seen, [action.id]: "no" };
      const next = { ...room, lexicon: { ...L, seen } };
      return room.players.every((p) => seen[p.id]) ? { ...next, lexicon: { ...next.lexicon, phase: "write", notice: null } } : next;
    }
    case "LEX_LEVEL": {
      // easy = every word (including the easy ones, marked e); hard = only the words not marked easy
      if (!room.lexicon || room.lexicon.phase !== "level") return room;
      const all = LEXICON.map((_, i) => i);
      let ids = action.level === "easy" ? all : all.filter((i) => !LEXICON[i].e);
      if (ids.length < 5) ids = all;
      return { ...room, lexicon: { ...lexiconRound(shuffle(ids), 0), level: action.level } };
    }
    case "LEX_START_WRITE": {
      const L = room.lexicon;
      return L && L.phase === "check" ? { ...room, lexicon: { ...L, phase: "write", notice: null } } : room;
    }
    case "LEX_SUBMIT": {
      const L = room.lexicon;
      if (!L || L.phase !== "write" || !room.players.some((p) => p.id === action.id)) return room;
      const text = String(action.text || "").trim().slice(0, 120);
      if (!text) return room;
      // No automatic move to the vote when everyone has sent: a definition can be fixed until the host reveals them.
      return { ...room, lexicon: { ...L, defs: { ...L.defs, [action.id]: text } } };
    }
    case "LEX_BACK_WRITE": { // the host reopens the writing of the same word (definitions kept, votes dropped)
      const L = room.lexicon;
      return L && L.phase === "vote" ? { ...room, lexicon: { ...L, phase: "write", options: [], votes: {} } } : room;
    }
    case "LEX_BACK_WORD": { // the host returns to the previous word, exactly where it was left
      const L = room.lexicon;
      return L && L.prev ? { ...room, lexicon: { ...L, ...L.prev, prev: null } } : room;
    }
    case "LEX_TO_VOTE": {
      const L = room.lexicon;
      if (!L || L.phase !== "write" || Object.keys(L.defs).length < 1) return room;
      return lexiconToVote(room);
    }
    case "LEX_VOTE": {
      const L = room.lexicon;
      if (!L || L.phase !== "vote") return room;
      const opt = L.options.find((o) => o.id === action.option);
      if (!opt || opt.owner === action.id || !room.players.some((p) => p.id === action.id)) return room;
      const votes = { ...L.votes, [action.id]: action.option };
      const next = { ...room, lexicon: { ...L, votes } };
      return room.players.every((p) => votes[p.id] || !L.options.some((o) => o.owner !== p.id)) ? lexiconReveal(next) : next;
    }
    case "LEX_REVEAL": {
      const L = room.lexicon;
      return L && L.phase === "vote" ? lexiconReveal(room) : room;
    }
    case "LEX_SKIP": { // only the host swaps the word (players pressed it by mistake); a player who knows the word uses LEX_KNOW
      const L = room.lexicon;
      if (!L || action.id || !["check", "write", "vote"].includes(L.phase)) return room;
      return { ...room, lexicon: lexiconRound(L.deck, L.cursor + 1, { word: LEXICON[L.wordIdx].w, by: "המנחה", swapped: true }, L) };
    }
    case "LEX_NEXT": {
      const L = room.lexicon;
      if (!L || L.phase !== "result") return room;
      return { ...room, lexicon: lexiconRound(L.deck, L.cursor + 1, null, L) };
    }

    case "START_TURN": {
      const key = action.game;
      const g = room[key];
      if (!g) return room;
      return { ...room, [key]: { ...g, phase: "playing", timeLeft: TURN_SECONDS[key] || 60, correct: 0, skips: 0, guessed: {}, won: null } };
    }
    case "NEXT_TURN": {
      const key = action.game;
      const g = room[key];
      if (!g) return room;
      // the next player starts on a fresh card, never the one the last player was left on
      return { ...room, [key]: { ...g, phase: "ready", turnIdx: (g.turnIdx + 1) % room.players.length, cursor: (g.cursor + 1) % g.deck.length } };
    }
    case "TICK": {
      const key = action.game;
      const g = room[key];
      if (!g || g.phase !== "playing" || room.paused) return room; // the clock waits while paused
      const timeLeft = g.timeLeft - 1;
      if (timeLeft <= 0) {
        const players = bankTurn(room, key);
        return { ...room, players, [key]: { ...g, timeLeft: 0, phase: "turnEnd" } };
      }
      return { ...room, [key]: { ...g, timeLeft } };
    }
    case "RESULT": {
      const key = action.game;
      const g = room[key];
      if (!g || g.phase !== "playing" || room.paused || action.cursor !== g.cursor) return room; // stale/duplicate tap guard
      if (key === "alias" && g.mode === "solo" && action.result === "correct") return room; // solo: must say who guessed (ALIAS_GUESS)
      const correct = g.correct + (action.result === "correct" ? 1 : 0);
      const skips = g.skips + (action.result === "skip" ? 1 : 0);
      const cursor = (g.cursor + 1) % g.deck.length;
      const won = key === "whoami" ? (action.result === "correct" ? { word: g.deck[g.cursor], n: (g.won?.n || 0) + 1 } : null) : undefined;
      return { ...room, [key]: { ...g, correct, skips, cursor, ...(won !== undefined ? { won } : {}) } };
    }

    case "ALIAS_GUESS": {
      const g = room.alias;
      if (!g || g.mode !== "solo" || g.phase !== "playing" || room.paused || action.cursor !== g.cursor) return room;
      const describer = room.players[g.turnIdx];
      if (!describer || action.guesserId === describer.id || !room.players.some((p) => p.id === action.guesserId)) return room;
      const guessed = { ...g.guessed, [action.guesserId]: (g.guessed?.[action.guesserId] || 0) + 1 };
      return { ...room, alias: { ...g, correct: g.correct + 1, guessed, cursor: (g.cursor + 1) % g.deck.length } };
    }

    case "SHRINK_NEXT": {
      // another round: the next player in line is suggested as the psychologist, the host can still change it
      const s = room.shrink;
      const i = room.players.findIndex((p) => p.id === s?.psychId);
      const next = room.players[(i + 1) % room.players.length];
      return { ...room, shrink: { phase: "select", psychId: next?.id || null, rule: "", clues: 0, found: false, totalScore: 0 } };
    }

    case "SHRINK_SELECT":
      return { ...room, shrink: { ...room.shrink, psychId: action.id } };
    case "SHRINK_ASSIGN": {
      // One secret rule, the same for everyone except the psychologist.
      const rule = buildShrinkRule();
      return { ...room, shrink: { ...room.shrink, rule, clues: 0, found: false, phase: "diagnose" } };
    }
    case "SHRINK_REROLL": {
      // nobody feels like this rule: swap it for a different one and start the round's clues over
      const S = room.shrink;
      if (!S || S.phase !== "diagnose" || S.found) return room;
      let rule = buildShrinkRule();
      for (let i = 0; i < 20 && rule === S.rule; i++) rule = buildShrinkRule();
      return { ...room, shrink: { ...S, rule, clues: 0 } };
    }
    case "SHRINK_CLUE":
      return { ...room, shrink: { ...room.shrink, clues: room.shrink.clues + 1 } };
    case "SHRINK_DIAGNOSE":
      return { ...room, shrink: { ...room.shrink, found: true } };
    case "SHRINK_FINISH": {
      const s = room.shrink;
      const totalScore = s.found ? Math.max(1, 3 - s.clues) : 0;
      const players = room.players.map((p) => (p.id === s.psychId ? { ...p, score: p.score + totalScore, diagnosed: p.diagnosed + (s.found ? 1 : 0) } : p));
      return { ...room, players, shrink: { ...s, phase: "result", totalScore } };
    }

    case "SHRINK_AGAIN": {
      // "another round" straight from the diagnose screen: bank the score, then move on to picking the next psychologist
      const S = room.shrink;
      if (!S || S.phase !== "diagnose") return room;
      return roomReducer(roomReducer(room, { type: "SHRINK_FINISH" }), { type: "SHRINK_NEXT" });
    }

    default:
      return room;
  }
}
