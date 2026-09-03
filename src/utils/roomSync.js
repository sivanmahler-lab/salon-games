import { createClient } from "@supabase/supabase-js";
import { GAME_DEFS } from "../constants/theme";
import { shuffle, buildPersonas, buildShrinkPool, buildAliasDeck } from "../data/datasets";

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
    spice: 2,
    enabledGames: GAME_DEFS.map((g) => g.id),
    players: [],
    whoami: null,
    shrink: null,
    alias: null,
  };
}

function startTurnGameState(players, deck) {
  return { deck, turnIdx: 0, cursor: 0, phase: "ready", timeLeft: 60, correct: 0, skips: 0 };
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
      return { ...room, screen: "hub" };
    case "GO_PODIUM":
      return { ...room, screen: "podium" };
    case "PLAY_AGAIN": {
      const players = room.players.map((p) => ({ ...p, score: 0, correct: 0, skips: 0, diagnosed: 0 }));
      return { ...room, players, screen: "hub", whoami: null, shrink: null, alias: null };
    }

    case "START_GAME": {
      if (action.game === "whoami") {
        return { ...room, screen: "whoami", whoami: startTurnGameState(room.players, shuffle(buildPersonas(room.players, room.spice))) };
      }
      if (action.game === "alias") {
        return { ...room, screen: "alias", alias: startTurnGameState(room.players, shuffle(buildAliasDeck(room.players))) };
      }
      if (action.game === "shrink") {
        return { ...room, screen: "shrink", shrink: { phase: "select", psychId: null, rules: {}, clues: {}, diagnosed: {}, totalScore: 0 } };
      }
      return room;
    }

    case "START_TURN": {
      const key = action.game;
      const g = room[key];
      if (!g) return room;
      return { ...room, [key]: { ...g, phase: "playing", timeLeft: 60, correct: 0, skips: 0 } };
    }
    case "NEXT_TURN": {
      const key = action.game;
      const g = room[key];
      if (!g) return room;
      return { ...room, [key]: { ...g, phase: "ready", turnIdx: (g.turnIdx + 1) % room.players.length } };
    }
    case "TICK": {
      const key = action.game;
      const g = room[key];
      if (!g || g.phase !== "playing") return room;
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
      if (!g || g.phase !== "playing" || action.cursor !== g.cursor) return room; // stale/duplicate tap guard
      const correct = g.correct + (action.result === "correct" ? 1 : 0);
      const skips = g.skips + (action.result === "skip" ? 1 : 0);
      const cursor = (g.cursor + 1) % g.deck.length;
      return { ...room, [key]: { ...g, correct, skips, cursor } };
    }

    case "SHRINK_SELECT":
      return { ...room, shrink: { ...room.shrink, psychId: action.id } };
    case "SHRINK_ASSIGN": {
      const others = room.players.filter((p) => p.id !== room.shrink.psychId);
      const pool = buildShrinkPool(others);
      const rules = {};
      const clues = {};
      const diagnosed = {};
      pool.forEach(({ player, rule }) => {
        rules[player.id] = rule;
        clues[player.id] = 0;
        diagnosed[player.id] = false;
      });
      return { ...room, shrink: { ...room.shrink, rules, clues, diagnosed, phase: "diagnose" } };
    }
    case "SHRINK_CLUE":
      return { ...room, shrink: { ...room.shrink, clues: { ...room.shrink.clues, [action.id]: room.shrink.clues[action.id] + 1 } } };
    case "SHRINK_DIAGNOSE":
      return { ...room, shrink: { ...room.shrink, diagnosed: { ...room.shrink.diagnosed, [action.id]: true } } };
    case "SHRINK_FINISH": {
      const s = room.shrink;
      const totalScore = Object.keys(s.diagnosed).reduce(
        (acc, id) => acc + (s.diagnosed[id] ? Math.max(1, 3 - s.clues[id]) : 0),
        0
      );
      const diagCount = Object.values(s.diagnosed).filter(Boolean).length;
      const players = room.players.map((p) => (p.id === s.psychId ? { ...p, score: p.score + totalScore, diagnosed: p.diagnosed + diagCount } : p));
      return { ...room, players, shrink: { ...s, phase: "result", totalScore } };
    }

    default:
      return room;
  }
}
