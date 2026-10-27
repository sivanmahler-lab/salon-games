/* Who am I, one phone in the middle of the room, and the room version where everyone plays on their own phone. Pure rules, no screens. */

import { WHO } from "../data/salonContent";

export const WHO_TIMES = [45, 60, 90];

export function whoPool(cats) {
  const out = [];
  for (const k of cats) for (const w of WHO[k] || []) out.push({ w, c: k });
  return out;
}

export function parsePlayers(text) {
  return text
    .split(/[,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function whoTurnName(players, turn, round) {
  return players.length ? players[turn % players.length] : "סיבוב " + round;
}

// Toggle a topic on or off; at least one topic always stays selected.
export function toggleCategory(cats, k) {
  const next = new Set(cats);
  if (next.has(k)) {
    if (next.size > 1) next.delete(k);
  } else next.add(k);
  return next;
}

/* ---------- every player on their own phone ---------- */

export const ROOM_CODE_RE = /^[0-9]{3,6}$/;

export function newRoomCode() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

// Everyone in this room code, as the transport reports them.
export function roomPlayers(peers, code) {
  return peers.filter((p) => p.kind === "viewer" && p.presence && p.presence.code === code);
}

// Whose turn it is: among the players who have a character and have not found it yet, the one who has
// played the fewest turns; ties go in a fixed order. Play does not wait for anyone to find their
// character: after each turn it simply moves on to the next player.
export function currentTurn(players) {
  const eligible = players.filter((p) => p.presence.card && !p.presence.guessed);
  if (!eligible.length) return null;
  return eligible
    .slice()
    .sort((a, b) => (a.presence.done || 0) - (b.presence.done || 0) || (a.peer < b.peer ? -1 : 1))[0];
}

// A new character: one nobody in the room has right now; if all are taken, any will do.
export function pickCharacter(players, cat, random = Math.random) {
  const used = new Set(players.map((p) => p.presence.card).filter(Boolean));
  const keys = cat === "all" ? Object.keys(WHO) : [cat];
  let pool = [];
  for (const k of keys) for (const w of WHO[k]) if (!used.has(w)) pool.push({ w, c: k });
  if (!pool.length) for (const k of keys) for (const w of WHO[k]) pool.push({ w, c: k });
  return pool[Math.floor(random() * pool.length)];
}

// What to write about me when I take a character. A player who joins the rotation starts level with the
// others, so nobody gets several turns in a row.
export function drawPatch(players, pick) {
  const patch = { card: pick.w, cat: pick.c, guessed: false };
  const mine = players.find((p) => p.isMe && p.sameTab);
  if (!(mine && mine.presence.card)) {
    const others = players.filter((p) => !(p.isMe && p.sameTab) && p.presence.card && !p.presence.guessed);
    patch.done = others.length ? Math.min(...others.map((p) => p.presence.done || 0)) : 0;
  }
  return patch;
}
