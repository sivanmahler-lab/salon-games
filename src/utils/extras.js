import { COLORS } from "../constants/theme";
import { lsGet, lsSet } from "./soloHelpers";

/* Extras: look (dark / light / large text), sounds and vibration, the all-evenings scoreboard, and the share image. */

/* ---------------- look ---------------- */
const DARK = { ...COLORS };
const LIGHT = { bg: "#f5f3ee", bg2: "#ebe7de", surface: "#ffffff", surfaceAlt: "#ece8df", border: "#d4cfc3", emerald: "#047857", amber: "#b45309", purple: "#7e22ce", coral: "#e11d48", sky: "#0369a1", text: "#14192a", muted: "#5b6477" };

export function loadPrefs() {
  try { return { light: lsGet("salon-light") === "1", large: lsGet("salon-large") === "1", sound: lsGet("salon-sound") !== "0" }; } catch (e) { return { light: false, large: false, sound: true }; }
}
export function savePref(key, on) { lsSet(`salon-${key}`, on ? "1" : "0"); }
export function applyLook(light) { Object.assign(COLORS, light ? LIGHT : DARK); document.body.style.background = COLORS.bg; }
let soundOn = loadPrefs().sound;
export function setSoundOn(on) { soundOn = on; window.__salonMute = !on; }
window.__salonMute = !soundOn;

/* ---------------- sound and vibration ---------------- */
export function buzz(pattern = 60) { try { if (soundOn && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* no vibration */ } }
export function cheer() {
  buzz([80, 60, 80, 60, 160]);
  if (!soundOn) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.resume) ctx.resume();
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "triangle"; osc.frequency.value = f; osc.connect(gain); gain.connect(ctx.destination);
      const at = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, at); gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      osc.start(at); osc.stop(at + 0.32);
    });
    setTimeout(() => { try { ctx.close(); } catch (e) { /* closed */ } }, 1500);
  } catch (e) { /* no sound */ }
}

/* ---------------- scoreboard of all evenings (kept on the host device) ---------------- */
const BOARD_KEY = "salon-board";
const NIGHT_KEY = "salon-night";
const readJson = (k, fallback) => { try { return JSON.parse(lsGet(k)) || fallback; } catch (e) { return fallback; } };
export const loadBoard = () => readJson(BOARD_KEY, {});

// Adds only what this room earned since the last save, so opening the podium twice never counts twice.
export function saveNight(roomCode, players) {
  if (!players.some((p) => p.score > 0)) return;
  const last = readJson(NIGHT_KEY, {});
  const base = last.roomCode === roomCode ? last.pts || {} : {};
  const board = loadBoard();
  const pts = {};
  players.forEach((p) => {
    const cur = p.score || 0;
    const before = base[p.name] || 0;
    const add = cur >= before ? cur - before : cur;
    pts[p.name] = cur;
    const row = board[p.name] || { points: 0, nights: 0 };
    row.points += add;
    if (last.roomCode !== roomCode || !(p.name in base)) row.nights += 1;
    board[p.name] = row;
  });
  lsSet(BOARD_KEY, JSON.stringify(board));
  lsSet(NIGHT_KEY, JSON.stringify({ roomCode, pts }));
}
export function clearBoard() { lsSet(BOARD_KEY, "{}"); lsSet(NIGHT_KEY, "{}"); }

/* ---------------- share image ---------------- */
export async function shareScores(players) {
  const rows = [...players].sort((a, b) => b.score - a.score).slice(0, 10);
  const W = 1080, H = 360 + rows.length * 110 + 120;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#090d16"; g.fillRect(0, 0, W, H);
  const grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, "#a855f7"); grad.addColorStop(1, "#f59e0b");
  g.fillStyle = grad; g.fillRect(0, 0, W, 16);
  g.direction = "rtl"; g.textAlign = "center";
  g.fillStyle = "#f4f6fb"; g.font = "900 84px Rubik, Heebo, sans-serif"; g.fillText("משחקי סלון", W / 2, 150);
  g.fillStyle = "#94a3b8"; g.font = "500 40px Heebo, sans-serif"; g.fillText(`הניקוד של הערב · ${new Date().toLocaleDateString("he-IL")}`, W / 2, 225);
  rows.forEach((p, i) => {
    const y = 300 + i * 110;
    g.fillStyle = i === 0 ? "#f59e0b33" : "#111b31"; g.fillRect(60, y, W - 120, 90);
    g.textAlign = "right"; g.fillStyle = "#f4f6fb"; g.font = "800 44px Heebo, sans-serif";
    g.fillText(`${["🥇", "🥈", "🥉"][i] || i + 1 + "."}  ${p.name}`, W - 90, y + 62);
    g.textAlign = "left"; g.fillStyle = "#f59e0b"; g.font = "900 48px Rubik, sans-serif"; g.fillText(String(p.score), 90, y + 62);
  });
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const file = new File([blob], "salon-scores.png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "משחקי סלון" }); return; }
  } catch (e) { return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "salon-scores.png"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
