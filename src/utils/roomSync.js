import { createClient } from "@supabase/supabase-js";
import { GAME_DEFS } from "../constants/theme";
import { shuffle, buildCharacters, buildShrinkRule, buildAliasDeck } from "../data/datasets";
import { LEXICON } from "../data/lexicon";

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
  };
}

// Seconds per turn: "מי אני" gets a minute and a half, the explaining game keeps a minute.
const TURN_SECONDS = { whoami: 90, alias: 60 };
function startTurnGameState(players, deck, seconds = 60) {
  return { deck, turnIdx: 0, cursor: 0, phase: "ready", timeLeft: seconds, correct: 0, skips: 0 };
}

/* ---- Lexicon (foreign word -> Hebrew meaning): each player invents a definition, everyone votes for the real one ---- */
// Every round opens with a check: anyone who already knows the word says so and the word is swapped for a new one.
// Only when everybody answers "I don't know it" does the writing start.
function lexiconRound(deck, cursor, notice = null) {
  const c = cursor % deck.length;
  return { deck, cursor: c, wordIdx: deck[c], phase: "check", seen: {}, notice, defs: {}, options: [], votes: {}, gains: {} };
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
    if (opt.owner === null) gains[voter] = (gains[voter] || 0) + 2; // found the real meaning
    else gains[opt.owner] = (gains[opt.owner] || 0) + 1; // fooled someone
  });
  const players = room.players.map((p) => {
    const gain = gains[p.id] || 0;
    const found = L.votes[p.id] === "real" ? 1 : 0;
    return gain || found ? { ...p, score: p.score + gain, correct: p.correct + found } : p;
  });
  return { ...room, players, lexicon: { ...L, phase: "result", gains } };
}

export function roomReducer(room, action) {
  switch (action.type) {
    case "JOIN": {
      if (room.players.some((p) => p.id === action.id)) return room;
      const player = { id: action.id, name: action.name, traits: action.traits || [], score: 0, correct: 0, skips: 0, diagnosed: 0 };
      return { ...room, players: [...room.players, player] };
    }
    case "SET_CONFIG":
      return { ...room, ...action.patch };
    case "START_HUB":
      return room.players.length >= 3 ? { ...room, screen: "hub" } : room;
    case "BACK_TO_HUB":
      return { ...room, screen: "hub", paused: false };
    case "GO_PODIUM":
      return { ...room, screen: "podium", paused: false };
    case "BACK_TO_LOBBY": // from the games list back to the evening's settings (to add or remove games)
      return { ...room, screen: "lobby", paused: false };
    case "SET_PAUSED":
      return { ...room, paused: !!action.value };
    case "PLAY_AGAIN": {
      const players = room.players.map((p) => ({ ...p, score: 0, correct: 0, skips: 0, diagnosed: 0 }));
      return { ...room, players, screen: "hub", paused: false, whoami: null, shrink: null, alias: null, lexicon: null };
    }

    case "START_GAME": {
      room = { ...room, paused: false };
      if (action.game === "whoami") {
        return { ...room, screen: "whoami", whoami: startTurnGameState(room.players, buildCharacters(), TURN_SECONDS.whoami) };
      }
      if (action.game === "alias") {
        return { ...room, screen: "alias", alias: startTurnGameState(room.players, shuffle(buildAliasDeck(room.players)), TURN_SECONDS.alias) };
      }
      if (action.game === "shrink") {
        return { ...room, screen: "shrink", shrink: { phase: "select", psychId: null, rule: "", clues: 0, found: false, totalScore: 0 } };
      }
      if (action.game === "lexicon") {
        return { ...room, screen: "lexicon", lexicon: lexiconRound(shuffle(LEXICON.map((_, i) => i)), 0) };
      }
      return room;
    }

    case "LEX_KNOW": {
      const L = room.lexicon;
      const me = room.players.find((p) => p.id === action.id);
      if (!L || L.phase !== "check" || !me) return room;
      if (action.known) {
        return { ...room, lexicon: lexiconRound(L.deck, L.cursor + 1, { word: LEXICON[L.wordIdx].w, by: me.name }) };
      }
      const seen = { ...L.seen, [action.id]: "no" };
      const next = { ...room, lexicon: { ...L, seen } };
      return room.players.every((p) => seen[p.id]) ? { ...next, lexicon: { ...next.lexicon, phase: "write", notice: null } } : next;
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
      const defs = { ...L.defs, [action.id]: text };
      const next = { ...room, lexicon: { ...L, defs } };
      return room.players.every((p) => defs[p.id]) ? lexiconToVote(next) : next;
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
    case "LEX_NEXT": {
      const L = room.lexicon;
      if (!L || L.phase !== "result") return room;
      return { ...room, lexicon: lexiconRound(L.deck, L.cursor + 1) };
    }

    case "START_TURN": {
      const key = action.game;
      const g = room[key];
      if (!g) return room;
      return { ...room, [key]: { ...g, phase: "playing", timeLeft: TURN_SECONDS[key] || 60, correct: 0, skips: 0 } };
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
        const turnPlayer = room.players[g.turnIdx];
        const players = room.players.map((p) =>
          p.id === turnPlayer.id ? { ...p, score: p.score + g.correct, correct: p.correct + g.correct, skips: p.skips + g.skips } : p
        );
        return { ...room, players, [key]: { ...g, timeLeft: 0, phase: "turnEnd" } };
      }
      return { ...room, [key]: { ...g, timeLeft } };
    }
    case "RESULT": {
      const key = action.game;
      const g = room[key];
      if (!g || g.phase !== "playing" || room.paused || action.cursor !== g.cursor) return room; // stale/duplicate tap guard
      const correct = g.correct + (action.result === "correct" ? 1 : 0);
      const skips = g.skips + (action.result === "skip" ? 1 : 0);
      const cursor = (g.cursor + 1) % g.deck.length;
      return { ...room, [key]: { ...g, correct, skips, cursor } };
    }

    case "SHRINK_SELECT":
      return { ...room, shrink: { ...room.shrink, psychId: action.id } };
    case "SHRINK_ASSIGN": {
      // One secret rule, the same for everyone except the psychologist.
      const rule = buildShrinkRule();
      return { ...room, shrink: { ...room.shrink, rule, clues: 0, found: false, phase: "diagnose" } };
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

    default:
      return room;
  }
}
