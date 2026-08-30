import React, { useState, useEffect, useMemo, useCallback, useRef, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Trash2, Flame, Star, PartyPopper, Zap, Sparkles,
  Timer, ThumbsUp, SkipForward, Brain, Stethoscope, DoorOpen, Eye, Lightbulb,
  Award, Trophy, Medal, Crown, RefreshCw, Home, ArrowLeft, LogOut,
  ChevronLeft, Check, Target, Gamepad2, HelpCircle, QrCode, Copy, Wifi, WifiOff,
} from "lucide-react";

/* ============================================================================
   NANNO BANANA presents: SALON (סלון) — real-time multiplayer edition
============================================================================ */

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

const COLORS = {
  bg: "#090d16",
  bg2: "#0f172a",
  surface: "#111b31",
  surfaceAlt: "#16223e",
  border: "#243352",
  emerald: "#10b981",
  amber: "#f59e0b",
  purple: "#a855f7",
  coral: "#f43f5e",
  text: "#f4f6fb",
  muted: "#94a3b8",
};

const CATEGORIES = [
  { id: "friday", label: "ערב שישי", icon: Flame },
  { id: "holiday", label: "חג משפחתי", icon: Star },
  { id: "birthday", label: "יום הולדת", icon: PartyPopper },
  { id: "friends", label: "ערב חברים", icon: Users },
];

const SPICE_LEVELS = [
  { id: 1, label: "מתוק ומשפחתי", desc: "עדין, מתאים לכולם", color: COLORS.emerald },
  { id: 2, label: "עוקצני במידה", desc: "קצת עקיצות, בלי לפגוע", color: COLORS.amber },
  { id: 3, label: "רוסט מלא", desc: "בלי רחמים", color: COLORS.coral },
];

const TRAIT_TAGS = [
  "תמיד מאחר/ת", "מסור/ה לקפה", "מלך/ת המנגל", "בדיחות אבא",
  "חופר/ת בווייז", "שוכח/ת מפתחות", "מדבר/ת עם הידיים", "בוכה/ה בסרטים",
];

const AVATAR_COLORS = [
  COLORS.emerald, COLORS.amber, COLORS.purple, COLORS.coral,
  "#38bdf8", "#f472b6", "#facc15", "#34d399",
];

const GAME_DEFS = [
  { id: "whoami", title: "מי אני?", desc: "דמות מצחיקה — כולם רואים חוץ מהמנחש/ת", icon: Brain, color: COLORS.purple },
  { id: "shrink", title: "הפסיכולוג", desc: "כלל התנהגות סודי לכל אחד, אחד/ת מאבחן/ת", icon: Stethoscope, color: COLORS.emerald },
  { id: "alias", title: "אליאס סלון", desc: "60 שניות, מסבירים מילה בלי להגיד אותה", icon: Zap, color: COLORS.amber },
];

const GENERIC_PERSONAS = [
  // מוזיקה ותרבות ישראלית
  "אריק איינשטיין", "שלמה ארצי", "שושנה דמארי", "יפה ירקוני", "עפרה חזה",
  "זוהר ארגוב", "מאיר אריאל", "אביב גפן", "שלום חנוך", "יהודית רביץ",
  "נורית גלרון", "חוה אלברשטיין", "צביקה פיק", "שרית חדד", "אייל גולן",
  "עומר אדם", "נועה קירל", "חנן בן ארי", "נטע ברזילי", "גידי גוב",
  "דני סנדרסון", "ברי סחרוף", "ריטה", "רמי קלינשטיין", "עדן חסון",

  // מלחינים ומוזיקה קלאסית
  "וולפגנג אמדאוס מוצרט", "לודוויג ואן בטהובן", "יוהאן סבסטיאן באך", "פרדריק שופן",
  "אנטוניו ויוואלדי", "פיוטר איליץ' צ'ייקובסקי", "יוהנס ברהמס", "ג'אקומו פוצ'יני",

  // ציירים ואמני עבר
  "לאונרדו דה וינצ'י", "מיכלאנג'לו", "וינסנט ואן גוך", "פבלו פיקאסו",
  "סלבדור דאלי", "קלוד מונה", "פרידה קאלו", "רמברנדט", "אנדי וורהול",

  // דמויות מסרטים וסדרות
  "הארי פוטר", "וולדמורט", "הרמיוני גריינג'ר", "דמבלדור",
  "דארת' ויידר", "לוק סקייווקר", "יודה", "ג'ק ספארו", "ג'יימס בונד",
  "אינדיאנה ג'ונס", "הג'וקר", "באטמן", "ספיידרמן", "סופרמן", "וולברין",
  "טוני סטארק (איירון מן)", "פורסט גאמפ", "ג'ק דוסון (טיטניק)", "טרמינטור",
  "ניאו (מטריקס)", "וולטר וייט", "טוני סופרנו", "רייצ'ל גרין (חברים)",
  "רוס גלר (חברים)", "ג'ואי טריביאני (חברים)", "מוניקה גלר (חברים)",
  "צ'נדלר בינג (חברים)", "שרלוק הולמס", "ג'ון סנואו", "דאינריז טארגאריין",
  "ונסדיי אדמס", "מירי פסקל", "שאולי", "ראובן (הפרלמנט)", "אבי הטחול",

  // דמויות מסרטים מצוירים ואנימציה
  "מיקי מאוס", "דונלד דאק", "באגס באני", "דאפי דאק", "בובספוג מכנסמרובע",
  "פטריק כוכב", "הומר סימפסון", "בארט סימפסון", "פיטר פן", "פינוקיו",
  "שלגיה", "סינדרלה", "אלזה (לשבור את הקרח)", "אולף",
  "סימבה (מלך האריות)", "מופאסה", "סקאר", "טימון ופומבה",
  "שרק", "החמור משרק", "באז שנות-אור", "וודי (צעצוע של סיפור)",
  "סקובי דו", "גארפילד", "פו הדב", "גרינץ'", "דרדסבא", "גרגמל", "פופאי", "פיקאצ'ו",

  // מנהיגים ופוליטיקה
  "דוד בן גוריון", "גולדה מאיר", "מנחם בגין", "יצחק רבין", "שמעון פרס",
  "משה דיין", "בנימין זאב הרצל", "בנימין נתניהו", "אריאל שרון",
  "וינסטון צ'רצ'יל", "אברהם לינקולן", "ג'ון פ. קנדי", "מרגרט תאצ'ר",
  "נלסון מנדלה", "נפוליאון בונפרטה", "יוליוס קיסר", "אלכסנדר הגדול",
  "ברק אובמה", "דונלד טראמפ", "המלכה אליזבת השנייה", "קלאופטרה", "מהטמה גנדי",

  // מדע, רוח וספורט
  "אלברט איינשטיין", "אייזק ניוטון", "מארי קירי", "זיגמונד פרויד", "וויליאם שייקספיר",
  "פלה", "דייגו מראדונה", "ליאו מסי", "כריסטיאנו רונאלדו", "מייקל ג'ורדן",
  "מוחמד עלי", "קובי בראיינט", "יוסיין בולט", "רוג'ר פדרר", "מיקי ברקוביץ'"
];

const PERSONA_TEMPLATES = {
  1: [
    "{name} כשהוא/היא מגיע/ה בזמן (אירוע נדיר)",
    "{name} מנסה לזכור איפה חנה/תה את הרכב",
    "{name} אחרי כוס קפה ראשונה בבוקר",
    "{name} כשכולם כבר מחכים לו/ה ליד הדלת",
    "{name} מנסה להיזכר איפה שם/ה את המשקפיים",
  ],
  2: [
    "{name} עם ה{trait} המפורסם שלו/ה",
    "{name} מסביר/ה למה איחר/ה, שוב",
    "{name} מנסה להיראות עסוק/ה באמצע פגישת עבודה",
    "{name} בטוח/ה שהפעם זו התוכנית שתצליח",
    "{name} רגע לפני שכולם שמים לב ל{trait} שלו/ה",
  ],
  3: [
    "{name} עם ה{trait} שכולם כבר מחקים מאחורי הגב",
    "{name} שבטוח/ה שהוא/היא ממש לא הכי גרוע/ה במשפחה",
    "{name} רגע לפני שהוא/היא עושה את ה{trait} בפעם המיליון",
    "{name} מספר/ת שוב את הסיפור שכולם כבר שמעו בעל פה",
    "{name} משוכנע/ת שאף אחד לא שם לב ל{trait} שלו/ה",
  ],
};

const GENERIC_SHRINK_RULES = [
  "כל פעם שמישהו עונה, הוא חייב להשתמש במילה שמתחילה באות האחרונה של השאלה",
  "עונים על כל שאלה כאילו אתם האדם שיושב משמאלכם",
  "לפני כל משפט אומרים 'כפי שכולם יודעים'",
  "מדברים בגוף שלישי על עצמכם, כל הזמן",
  "כל תשובה חייבת להכיל מספר כלשהו",
  "עונים על כל שאלה בשאלה נגדית",
  "מסיימים כל משפט במילה 'בערך'",
  "לוחצים יד לכל מי שמדבר איתכם, כל פעם מחדש",
  "מזכירים חיה כלשהי בכל תשובה שאתם נותנים",
  "מדברים לאט פי שניים מהרגיל, בלי הסבר",
  "מתחילים כל משפט במילה 'טכנית'",
  "מסתכלים לשמיים לרגע לפני שעונים על כל שאלה",
  "כל תשובה חייבת לכלול את המילה 'בעצם'",
  "מחקים את הטון של מי שדיבר/ה לפניכם",
  "עונים בלחישה על כל שאלה שקשורה לכסף",
  "מוסיפים 'אם תשאלו אותי' לפני כל דעה שלכם",
  "לא אומרים 'כן' או 'לא' באופן ישיר, אף פעם",
  "כל פעם שצוחקים, נוגעים באף שלכם",
  "מתייחסים לכולם בתואר 'אדוני' או 'גברתי'",
  "עונים על כל שאלה עם ציטוט מומצא בשם 'חכם עתיק'",
];

const PERSONALIZED_SHRINK_TEMPLATES = [
  "בכל תשובה תשלב/י את המילה '{tag}'",
  "תחקה/י את ה{trait} של עצמך בכל פעם שמישהו צוחק",
  "תדבר/י כאילו אתה/את {name} האמיתי/ת, בלי לחשוף את זה",
  "תתייחס/י לכל שאלה כאילו היא על {tag}",
  "תזכיר/י את ה{trait} שלך לפחות פעם בכל תשובה",
  "תענה/י על כל שאלה כאילו אתה/את {name}",
  "תדבר/י על {tag} גם כשלא שואלים על זה בכלל",
  "כל תשובה שלך צריכה להישמע כמו שבעל/ת ה{trait} היה/הייתה עונה",
  "תסיים/י כל משפט בהתייחסות כלשהי ל{tag}",
  "תתנהג/י כאילו יש לך את ה{trait} של {name}",
];

const ALIAS_GENERAL_WORDS = [
  "פיצה", "ים", "חתונה", "נדנדה", "מדינה", "גיטרה", "מטריה", "שוקולד", "רכבת", "חלום",
  "מראה", "גשר", "דבש", "כרטיס", "מנורה", "שיר", "מסיבה", "ננס", "פינגווין", "קרקס",
  "מפתח", "שמיכה", "טרמפ", "גלידה", "חוף", "תרמיל", "שעון", "מגדלור", "דייג", "קסם",
  "בלון", "מדורה", "עוגה", "צלצול", "מצפן", "יומן", "שקיעה", "תור", "חידה", "מצלמה",
];

const ALIAS_PERSONAL_TEMPLATES = [
  "ה{trait} המפורסם של {name}",
  "המילה שתמיד יוצאת מהפה של {name}",
  "הרגע שבו {name} כמעט הביך/ה את כולם",
  "{name} כשמעירים אותו/ה משינה",
  "הכינוי הסודי שיש ל{name}",
  "היום ש{name} ניסה/תה להיות מגניב/ה מדי",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

function randomTrait(player) {
  if (player?.traits?.length) return player.traits[Math.floor(Math.random() * player.traits.length)];
  return null;
}

function fillTemplate(tpl, player, extra = {}) {
  const trait = randomTrait(player);
  return tpl
    .replace(/{name}/g, player?.name?.trim() || "מישהו כאן")
    .replace(/{trait}/g, trait || "התכונה המסתורית שלו/ה")
    .replace(/{tag}/g, extra.tag || pick(TRAIT_TAGS, 1)[0]);
}

function fieldAwarePool(templates, player, safePool) {
  const hasTrait = !!player?.traits?.length;
  const usable = templates.filter((t) => !t.includes("{trait}") || hasTrait);
  if (usable.length >= 3 || !safePool) return usable.length ? usable : templates;
  return shuffle([...usable, ...safePool]);
}

function buildPersonas(players, spice) {
  const level = spice || 2;
  const templates = PERSONA_TEMPLATES[level];
  const safe = PERSONA_TEMPLATES[1];
  const personalized = players.flatMap((p) => pick(fieldAwarePool(templates, p, safe), 2).map((t) => fillTemplate(t, p)));
  const generic = pick(GENERIC_PERSONAS, Math.max(30, players.length + 15));
  return shuffle([...personalized, ...generic]);
}

function buildShrinkPool(players) {
  return players.map((p) => {
    const personalPool = fieldAwarePool(PERSONALIZED_SHRINK_TEMPLATES, p, []);
    const combined = shuffle([...GENERIC_SHRINK_RULES, ...personalPool]);
    const tag = pick(TRAIT_TAGS, 1)[0];
    return { player: p, rule: fillTemplate(combined[0], p, { tag }) };
  });
}

function buildAliasDeck(players) {
  const personal = players.flatMap((p) => pick(fieldAwarePool(ALIAS_PERSONAL_TEMPLATES, p, []), 1).map((t) => fillTemplate(t, p)));
  const generalCount = Math.max(24, personal.length * 2);
  const general = pick(ALIAS_GENERAL_WORDS, generalCount);
  return shuffle([...personal, ...general]);
}

function generateId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function generateRoomCode() {
  const letters = "אבגדהוזחטיכלמנסעפצקרשת";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${l1}${l2}-${num}`;
}

function createInitialRoom() {
  return {
    screen: "lobby",
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

function roomReducer(room, action) {
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
      if (!g || g.phase !== "playing" || action.cursor !== g.cursor) return room;
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

function GlowBG() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: COLORS.purple }} />
      <div className="absolute top-1/2 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: COLORS.amber }} />
      <div className="absolute -bottom-32 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: COLORS.emerald }} />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, className = "", full }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-bold text-[15px] transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 shadow-lg shadow-black/30";
  const style =
    variant === "primary"
      ? { background: `linear-gradient(135deg, ${COLORS.purple}, #7c3aed)`, color: "#fff", boxShadow: "0 0 30px -8px rgba(168,85,247,.55)" }
      : variant === "gold"
      ? { background: `linear-gradient(135deg, ${COLORS.amber}, #fbbf24)`, color: "#0b0f1a" }
      : variant === "danger"
      ? { background: COLORS.coral, color: "#fff" }
      : variant === "ghost"
      ? { background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.text }
      : { background: COLORS.surfaceAlt, color: COLORS.text };
  return (
    <button onClick={onClick} disabled={disabled} style={style} className={`${full ? "w-full" : ""} ${base} ${className}`}>
      {children}
    </button>
  );
}

function Chip({ label, active, onClick, color = COLORS.purple }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
      style={{ borderColor: active ? color : COLORS.border, background: active ? `${color}22` : "transparent", color: active ? color : COLORS.muted }}
    >
      {label}
    </button>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border p-5 backdrop-blur-xl ${className}`} style={{ background: "rgba(255,255,255,0.04)", borderColor: COLORS.border }}>
      {children}
    </div>
  );
}

function PartyCard({ children, stampColor = COLORS.purple, stampLabel, big }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative w-full rounded-2xl border-2 border-dashed p-6 shadow-2xl shadow-black/50"
      style={{ background: "#f8f5ee", borderColor: "#d9d2bf", color: "#1a1a1a" }}
    >
      {stampLabel && (
        <div className="absolute -top-3 right-4 rotate-[6deg] rounded-md px-2 py-0.5 text-[11px] font-black tracking-wide text-white shadow" style={{ background: stampColor }}>
          {stampLabel}
        </div>
      )}
      <div className={`text-center font-black leading-snug ${big ? "text-3xl md:text-5xl" : "text-xl md:text-2xl"}`} style={{ fontFamily: "Rubik, Heebo, sans-serif" }}>
        {children}
      </div>
    </motion.div>
  );
}

function Avatar({ index, name }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-[#0b0f1a]" style={{ background: color }}>
      {(name || "").trim() ? name.trim()[0] : index + 1}
      <span className="absolute -bottom-1.5 -left-1.5 text-base">🍌</span>
    </div>
  );
}

function Confetti({ burstKey }) {
  const emojis = ["🎉", "✨", "🎊", "⭐", "🍌"];
  if (!burstKey) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => {
        const x = Math.random() * 100;
        const delay = Math.random() * 0.3;
        return (
          <motion.div
            key={`${burstKey}-${i}`}
            initial={{ opacity: 1, top: "40%", left: `${x}%`, scale: 0.6 }}
            animate={{ opacity: 0, top: "-10%", scale: 1.2, rotate: Math.random() * 180 }}
            transition={{ duration: 1.4, delay, ease: "easeOut" }}
            className="absolute text-3xl"
          >
            {emojis[i % emojis.length]}
          </motion.div>
        );
      })}
    </div>
  );
}

function HelpModal({ title, steps, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border p-6 md:rounded-3xl"
        style={{ background: COLORS.surface, borderColor: COLORS.border }}
      >
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle size={20} color={COLORS.purple} />
          <div className="text-lg font-black" style={{ color: COLORS.text }}>{title}</div>
        </div>
        <ol className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: COLORS.text }}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black" style={{ background: `${COLORS.purple}33`, color: COLORS.purple }}>
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <Btn full variant="primary" className="mt-5" onClick={onClose}>הבנתי, בואו נשחק</Btn>
      </motion.div>
    </motion.div>
  );
}

function TopBar({ title, onBack, backLabel, right, helpTitle, helpSteps }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="mb-4 flex items-center justify-between">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
          {backLabel === "exit" ? <LogOut size={16} /> : <Home size={16} />}
          {backLabel === "exit" ? "עזיבת החדר" : "מרכז המשחקים"}
        </button>
      ) : (
        <div className="w-[92px]" />
      )}
      <div className="flex items-center gap-2">
        <div className="text-sm font-bold" style={{ color: COLORS.text }}>{title}</div>
        {helpSteps && (
          <button onClick={() => setHelpOpen(true)} className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: COLORS.surfaceAlt, color: COLORS.purple }}>
            <HelpCircle size={14} />
          </button>
        )}
      </div>
      <div className="min-w-[80px] text-left text-sm font-bold" style={{ color: COLORS.amber }}>{right}</div>
      <AnimatePresence>
        {helpOpen && helpSteps && <HelpModal title={helpTitle} steps={helpSteps} onClose={() => setHelpOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Logo({ size = "text-xl" }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest" style={{ color: COLORS.amber }}>
        🍌 NANNO BANANA PRESENTS
      </div>
      <div className={`${size} font-black tracking-tight`} style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>
        SALON <span style={{ color: COLORS.purple }}>סלון</span>
      </div>
    </div>
  );
}

function QRMock({ text }) {
  const grid = useMemo(() => {
    let seed = 0;
    for (const c of text) seed += c.charCodeAt(0);
    let s = seed || 1;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const size = 9;
    const cells = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        const inFinder = (r < 3 && c < 3) || (r < 3 && c > size - 4) || (r > size - 4 && c < 3);
        row.push(
          inFinder
            ? (r === 1 && c === 1) || (r === 1 && c === size - 2) || (r === size - 2 && c === 1)
              ? true
              : r === 0 || r === 2 || c === 0 || c === 2 || r === size - 1 || r === size - 3 || c === size - 1 || c === size - 3
            : rand() > 0.55
        );
      }
      cells.push(row);
    }
    return cells;
  }, [text]);
  return (
    <div className="grid gap-[3px] rounded-lg bg-white p-3" style={{ gridTemplateColumns: "repeat(9, 1fr)", width: 148, height: 148 }}>
      {grid.flat().map((on, i) => (
        <div key={i} className="rounded-[1px]" style={{ background: on ? "#0b0f1a" : "transparent" }} />
      ))}
    </div>
  );
}

function EntryScreen({ onHost, onJoin, prefillCode }) {
  const [sub, setSub] = useState(prefillCode ? "join" : "choose");
  const [code, setCode] = useState(prefillCode || "");
  const [name, setName] = useState("");
  const [traits, setTraits] = useState([]);

  const toggleTrait = (t) => setTraits((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));
  const canJoin = code.trim().length > 0 && name.trim().length > 0;

  if (sub === "join") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 flex justify-center"><Logo size="text-3xl" /></div>
        <GlassCard className="space-y-4">
          <div className="text-center text-lg font-black" style={{ color: COLORS.text }}>הצטרפות מהטלפון שלכם</div>
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: COLORS.muted }}>קוד החדר</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="לדוגמה: אב-1234"
              className="w-full rounded-xl border bg-transparent px-3.5 py-3 text-center text-lg font-black tracking-widest outline-none focus:border-[#a855f7]"
              style={{ borderColor: COLORS.border, color: COLORS.text }}
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: COLORS.muted }}>השם שלכם</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="איך קוראים לכם?"
              className="w-full rounded-xl border bg-transparent px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#a855f7]"
              style={{ borderColor: COLORS.border, color: COLORS.text }}
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: COLORS.muted }}>תכונות (אופציונלי, אפשר כמה)</div>
            <div className="flex flex-wrap gap-1.5">
              {TRAIT_TAGS.map((t) => (
                <Chip key={t} label={t} active={traits.includes(t)} onClick={() => toggleTrait(t)} color={COLORS.emerald} />
              ))}
            </div>
          </div>
          <Btn full variant="primary" disabled={!canJoin} onClick={() => onJoin({ roomCode: code.trim(), name: name.trim(), traits })}>
            <Wifi size={18} /> הצטרפות לחדר
          </Btn>
          <button onClick={() => setSub("choose")} className="w-full text-center text-xs font-bold" style={{ color: COLORS.muted }}>חזרה</button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <Logo size="text-4xl" />
      <p className="text-sm" style={{ color: COLORS.muted }}>
        מכשיר אחד מארח את הערב (המסך הראשי), וכל השאר מצטרפים מהטלפונים שלהם.
      </p>
      <div className="w-full space-y-3">
        <Btn full variant="primary" onClick={onHost}><QrCode size={18} /> אירוח ערב — המסך הראשי</Btn>
        <Btn full variant="gold" onClick={() => setSub("join")}><Wifi size={18} /> הצטרפות מהטלפון שלי</Btn>
      </div>
      <p className="text-[11px]" style={{ color: COLORS.muted }}>
        לבדיקה: פתחו את שני המצבים בשני חלונות/כרטיסיות באותו דפדפן — הם מתסנכרנים אוטומטית.
      </p>
    </div>
  );
}

function computeBadges(players) {
  const badges = {};
  const add = (id, label) => { if (!id) return; badges[id] = badges[id] ? [...badges[id], label] : [label]; };
  if (!players.length) return badges;

  const byScore = [...players].sort((a, b) => b.score - a.score)[0];
  const byCorrect = [...players].sort((a, b) => b.correct - a.correct)[0];
  const bySkips = [...players].sort((a, b) => b.skips - a.skips)[0];
  const byDiag = [...players].sort((a, b) => b.diagnosed - a.diagnosed)[0];

  if (byScore && byScore.score > 0) add(byScore.id, "אלוף/ת הערב 🏆");
  if (byCorrect && byCorrect.correct > 0) add(byCorrect.id, "מלך/ת השליפות 🎯");
  if (bySkips && bySkips.skips > 0) add(bySkips.id, "אלוף/ת הדילוגים ⏭️");
  if (byDiag && byDiag.diagnosed > 0) add(byDiag.id, "המאבחן/ת החד/ה 🧠");

  return badges;
}

function PodiumStand({ player, place, index }) {
  const heights = { 1: 168, 2: 128, 3: 100 };
  const medalColor = { 1: COLORS.amber, 2: "#c7d2e0", 3: "#cd7f32" };
  const Icon = place === 1 ? Crown : Medal;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, type: "spring", stiffness: 220, damping: 20 }}
      className="flex flex-col items-center gap-2"
    >
      <Icon size={place === 1 ? 30 : 24} color={medalColor[place]} />
      <div className="text-center">
        <div className="font-black" style={{ color: COLORS.text }}>{player.name}</div>
        <div className="text-xs font-bold" style={{ color: COLORS.amber }}>{player.score} נק׳</div>
      </div>
      <div
        className="flex w-20 items-start justify-center rounded-t-2xl border-t border-x pt-2 text-2xl font-black md:w-24"
        style={{ height: heights[place], background: `${medalColor[place]}22`, borderColor: medalColor[place], color: medalColor[place] }}
      >
        {place}
      </div>
    </motion.div>
  );
}

function Podium({ players, actions }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const [first, second, third] = [top3[0], top3[1], top3[2]];
  const badges = useMemo(() => computeBadges(players), [players]);
  const [burst] = useState(1);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-8 md:max-w-xl">
      <Confetti burstKey={burst} />
      <div className="mb-6 flex justify-center"><Logo /></div>
      <div className="mb-2 text-center text-xl font-black" style={{ color: COLORS.text }}>לוח התוצאות</div>
      <p className="mb-8 text-center text-sm" style={{ color: COLORS.muted }}>ערב בלתי נשכח, רשמית 🍌</p>

      <div className="mb-10 flex items-end justify-center gap-3">
        {second && <PodiumStand player={second} place={2} index={0} />}
        {first && <PodiumStand player={first} place={1} index={1} />}
        {third && <PodiumStand player={third} place={3} index={2} />}
      </div>

      <div className="mb-8 space-y-2.5">
        {sorted.map((p, i) => {
          const list = badges[p.id];
          return (
            <GlassCard key={p.id} className="flex items-center gap-3 py-3">
              <span className="w-5 text-center text-sm font-black" style={{ color: COLORS.muted }}>{i + 1}</span>
              <Avatar index={i} name={p.name} />
              <div className="flex-1">
                <div className="font-bold" style={{ color: COLORS.text }}>{p.name}</div>
                {list && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {list.map((b) => (
                      <span key={b} className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${COLORS.purple}22`, color: COLORS.purple }}>{b}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-black" style={{ color: COLORS.amber }}>{p.score}</span>
            </GlassCard>
          );
        })}
      </div>

      {actions}
    </div>
  );
}

function HostLobby({ room, dispatch, roomCode, onExit }) {
  const setConfig = (patch) => dispatch({ type: "SET_CONFIG", patch });
  const toggleGame = (id) =>
    setConfig({ enabledGames: room.enabledGames.includes(id) ? room.enabledGames.filter((g) => g !== id) : [...room.enabledGames, id] });

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(roomCode)}` : roomCode;
  const [copied, setCopied] = useState(false);
  const canStart = room.players.length >= 3 && room.enabledGames.length >= 1;

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-8 md:max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
          <LogOut size={14} /> סגירת חדר
        </button>
        <Logo />
        <div className="w-[92px]" />
      </div>

      <GlassCard className="mb-6 flex flex-col items-center gap-3 text-center">
        <QRMock text={joinUrl} />
        <div className="flex items-center gap-2">
          <div className="rounded-xl border px-4 py-2 text-lg font-black tracking-widest" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>
            {roomCode}
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(roomCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="rounded-xl p-2.5"
            style={{ background: COLORS.surfaceAlt, color: COLORS.muted }}
          >
            {copied ? <Check size={18} color={COLORS.emerald} /> : <Copy size={18} />}
          </button>
        </div>
        <p className="text-xs" style={{ color: COLORS.muted }}>סרקו את הקוד או הזינו אותו ידנית בטלפון כדי להצטרף</p>
      </GlassCard>

      <div className="space-y-6">
        <section>
          <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>קטגוריית הערב</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = room.category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setConfig({ category: c.id })}
                  className="flex flex-col items-center gap-2 rounded-2xl border p-3.5 transition-all active:scale-95"
                  style={{ borderColor: active ? COLORS.purple : COLORS.border, background: active ? `${COLORS.purple}1a` : COLORS.surface }}
                >
                  <Icon size={22} color={active ? COLORS.purple : COLORS.muted} />
                  <span className="text-xs font-bold" style={{ color: active ? COLORS.text : COLORS.muted }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>רמת חריפות</div>
          <div className="space-y-2.5">
            {SPICE_LEVELS.map((s) => {
              const active = room.spice === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setConfig({ spice: s.id })}
                  className="flex w-full items-center justify-between rounded-2xl border p-3.5 text-right transition-all active:scale-95"
                  style={{ borderColor: active ? s.color : COLORS.border, background: active ? `${s.color}1a` : COLORS.surface }}
                >
                  <div>
                    <div className="font-bold" style={{ color: active ? s.color : COLORS.text }}>{s.label}</div>
                    <div className="text-xs" style={{ color: COLORS.muted }}>{s.desc}</div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Flame key={i} size={15} color={i < s.id ? s.color : COLORS.border} fill={i < s.id ? s.color : "none"} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>אילו משחקים בתוכנית?</div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {GAME_DEFS.map((g) => {
              const Icon = g.icon;
              const active = room.enabledGames.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGame(g.id)}
                  className="flex items-center gap-3 rounded-2xl border p-3.5 text-right transition-all active:scale-95"
                  style={{ borderColor: active ? g.color : COLORS.border, background: active ? `${g.color}1a` : COLORS.surface }}
                >
                  <Icon size={20} color={active ? g.color : COLORS.muted} />
                  <span className="text-sm font-bold" style={{ color: active ? COLORS.text : COLORS.muted }}>{g.title}</span>
                  {active && <Check size={16} color={g.color} className="mr-auto" />}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: COLORS.muted }}>
            <Users size={16} /> מי הצטרף עד עכשיו ({room.players.length})
          </div>
          {room.players.length === 0 ? (
            <p className="text-xs" style={{ color: COLORS.muted }}>ממתינים שיצטרפו שחקנים מהטלפונים שלהם...</p>
          ) : (
            <div className="space-y-2">
              {room.players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
                  <Avatar index={i} name={p.name} />
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: COLORS.text }}>{p.name}</div>
                    {p.traits.length > 0 && <div className="text-[11px]" style={{ color: COLORS.muted }}>{p.traits.join(" · ")}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Btn full variant="primary" disabled={!canStart} onClick={() => dispatch({ type: "START_HUB" })}>
          <Sparkles size={18} /> התחילו את הערב
        </Btn>
        {!canStart && <p className="mt-2 text-center text-[11px]" style={{ color: COLORS.muted }}>נדרשים 3 שחקנים מחוברים לפחות ומשחק אחד פעיל</p>}
      </div>
    </div>
  );
}

function HostHub({ room, dispatch, onPodium }) {
  const games = GAME_DEFS.filter((g) => room.enabledGames.includes(g.id));
  const anyScore = room.players.some((p) => p.score > 0 || p.correct > 0 || p.skips > 0 || p.diagnosed > 0);
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-8 md:max-w-xl">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <GlassCard className="mb-6 text-center text-xs font-bold" style={{ color: COLORS.muted }}>
        {room.players.length} שחקנים מחוברים — המסך הזה הוא מסך המנחה, בלי סודות עליו 🙈
      </GlassCard>
      <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>בחרו משחק</div>
      <div className="space-y-3">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => dispatch({ type: "START_GAME", game: g.id })}
              className="flex w-full items-center gap-4 rounded-2xl border p-4 text-right transition-all active:scale-[0.98]"
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.color}22` }}>
                <Icon size={22} color={g.color} />
              </div>
              <div className="flex-1">
                <div className="font-black" style={{ color: COLORS.text }}>{g.title}</div>
                <div className="text-xs" style={{ color: COLORS.muted }}>{g.desc}</div>
              </div>
              <ChevronLeft size={20} color={COLORS.muted} />
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <Btn full variant="gold" disabled={!anyScore} onClick={onPodium}><Trophy size={18} /> לוח התוצאות</Btn>
      </div>
    </div>
  );
}

function HostTurnGame({ room, dispatch, gameKey, title, color, stampLabel, onBack, helpTitle, helpSteps, readyCopy, playingCopy }) {
  const g = room[gameKey];
  const turnPlayer = room.players[g.turnIdx];
  const nextPlayer = room.players[(g.turnIdx + 1) % room.players.length];

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title={`${title} (מסך מנחה)`} onBack={onBack} right={g.phase === "playing" ? `⏱ ${g.timeLeft}` : ""} helpTitle={helpTitle} helpSteps={helpSteps} />

      {g.phase === "ready" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Avatar index={g.turnIdx} name={turnPlayer.name} />
          <div>
            <div className="text-xl font-black" style={{ color: COLORS.text }}>התור של {turnPlayer.name}!</div>
            <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>{readyCopy(turnPlayer.name)}</p>
          </div>
          <Btn variant="primary" onClick={() => dispatch({ type: "START_TURN", game: gameKey })}><Timer size={18} /> התחילו תור</Btn>
        </div>
      )}

      {g.phase === "playing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex w-full items-center justify-center gap-6 text-sm font-bold">
            <span style={{ color: COLORS.emerald }}>✓ {g.correct}</span>
            <span style={{ color: COLORS.coral }}>⏭ {g.skips}</span>
          </div>
          <div style={{ background: `${color}22`, borderColor: color }} className="w-full rounded-2xl border-2 border-dashed p-8">
            <div className="text-lg font-black" style={{ color: COLORS.text }}>{playingCopy(turnPlayer.name)}</div>
          </div>
          <p className="text-xs" style={{ color: COLORS.muted }}>{stampLabel}</p>
        </div>
      )}

      {g.phase === "turnEnd" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{turnPlayer.name} סיים/ה עם {g.correct} נקודות!</div>
          <div className="flex gap-6">
            <div><div className="text-2xl font-black" style={{ color: COLORS.emerald }}>{g.correct}</div><div className="text-xs" style={{ color: COLORS.muted }}>נכונות</div></div>
            <div><div className="text-2xl font-black" style={{ color: COLORS.coral }}>{g.skips}</div><div className="text-xs" style={{ color: COLORS.muted }}>דילוגים</div></div>
          </div>
          <Btn variant="primary" onClick={() => dispatch({ type: "NEXT_TURN", game: gameKey })}><ArrowLeft size={18} /> תור הבא: {nextPlayer.name}</Btn>
          <button onClick={onBack} className="text-xs font-bold" style={{ color: COLORS.muted }}>סיום המשחק וחזרה למרכז</button>
        </div>
      )}
    </div>
  );
}

function HostWhoAmI({ room, dispatch, onBack }) {
  return (
    <HostTurnGame
      room={room}
      dispatch={dispatch}
      gameKey="whoami"
      title="מי אני?"
      color={COLORS.purple}
      stampLabel="הכרטיס גלוי עכשיו רק בטלפונים של שאר השחקנים"
      onBack={onBack}
      helpTitle="איך משחקים ב'מי אני?' (מסך מנחה)"
      helpSteps={[
        "כל תור שייך לשחקן/ית אחד/ת — עכשיו זה מי שמוצג/ת למעלה.",
        "כשהתור מתחיל, הדמות הסודית מוצגת רק בטלפונים של שאר השחקנים — לא כאן ולא אצל המנחש/ת.",
        "שאר השחקנים מתארים במילים, והמנחש/ת עונה בקול. מי שרואה את הכרטיס לוחץ/ת בטלפון שלו/ה 'הצליח/ה!' או 'דלג'.",
        "המסך הזה רק עוקב אחרי הזמן והניקוד — אין עליו כפתורי ניחוש.",
      ]}
      readyCopy={(name) => `${name} לא יראה/תראה שום דבר במסך שלו/ה. שאר השחקנים יראו את הדמות בטלפונים שלהם ויתארו אותה.`}
      playingCopy={(name) => `ממתינים ש${name} ינחש/תנחש...`}
    />
  );
}

function HostAlias({ room, dispatch, onBack }) {
  return (
    <HostTurnGame
      room={room}
      dispatch={dispatch}
      gameKey="alias"
      title="אליאס סלון"
      color={COLORS.amber}
      stampLabel="המילה מוצגת רק בטלפון של מי שמסביר/ה עכשיו"
      onBack={onBack}
      helpTitle="איך משחקים ב'אליאס סלון' (מסך מנחה)"
      helpSteps={[
        "כל תור שייך לשחקן/ית אחד/ת שמסביר/ה — עכשיו זה מי שמוצג/ת למעלה.",
        "המילה מוצגת רק בטלפון שלו/ה. שאר השחקנים רואים כאן ובטלפונים שלהם רק את הזמן והניקוד.",
        "המסביר/ה מתאר/ת בלי להגיד את המילה, וכשמנחשים נכון לוחץ/ת בעצמו/ה 'נכון' או 'דלג' בטלפון שלו/ה.",
      ]}
      readyCopy={(name) => `${name} יראה/תראה את הכרטיס בטלפון שלו/ה בלבד ויתאר/תתאר אותו בלי להגיד את המילה.`}
      playingCopy={(name) => `${name} מסביר/ה עכשיו — שאר השחקנים מנחשים בקול`}
    />
  );
}

function HostShrink({ room, dispatch, onBack }) {
  const s = room.shrink;
  const psych = room.players.find((p) => p.id === s.psychId);
  const others = room.players.filter((p) => p.id !== s.psychId);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar
        title="הפסיכולוג (מסך מנחה)"
        onBack={onBack}
        right=""
        helpTitle="איך משחקים ב'הפסיכולוג' (מסך מנחה)"
        helpSteps={[
          "בחרו מי יהיה/תהיה הפסיכולוג/ית הערב מתוך רשימת השחקנים.",
          "לחיצה על 'הקצו כללים' שולחת לכל שאר השחקנים, בסודיות מלאה, כלל התנהגות משלהם — ישירות לטלפון שלהם.",
          "הפסיכולוג/ית מקבל/ת בטלפון שלו/ה לוח אבחון עם כפתורי רמז ואבחנה לכל שחקן/ית.",
          "הניקוד נספר אוטומטית לפי כמות הרמזים שהפסיכולוג/ית השתמש/ה בהם.",
        ]}
      />

      {s.phase === "select" && (
        <div className="flex flex-1 flex-col gap-5">
          <div className="text-center">
            <Stethoscope size={40} color={COLORS.emerald} className="mx-auto" />
            <div className="mt-3 text-xl font-black" style={{ color: COLORS.text }}>מי מאבחן/ת הערב?</div>
            <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>הבחירה תישלח ישירות לטלפון של כל אחד — לא צריך להעביר שום דבר.</p>
          </div>
          <div className="space-y-2">
            {room.players.map((p, i) => (
              <button
                key={p.id}
                onClick={() => dispatch({ type: "SHRINK_SELECT", id: p.id })}
                className="flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right"
                style={{ borderColor: s.psychId === p.id ? COLORS.emerald : COLORS.border, background: s.psychId === p.id ? `${COLORS.emerald}1a` : COLORS.surface }}
              >
                <Avatar index={i} name={p.name} />
                <span className="flex-1 font-bold" style={{ color: COLORS.text }}>{p.name}</span>
                {s.psychId === p.id && <Check size={18} color={COLORS.emerald} />}
              </button>
            ))}
          </div>
          <Btn variant="primary" disabled={!s.psychId} onClick={() => dispatch({ type: "SHRINK_ASSIGN" })}>
            <DoorOpen size={18} /> הקצו כללים סודיים והתחילו
          </Btn>
        </div>
      )}

      {s.phase === "diagnose" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Eye size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name} מאבחן/ת עכשיו</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>הכללים הסודיים כבר נמצאים בטלפונים של {others.map((p) => p.name).join(", ")}</p>
          <div className="w-full space-y-2">
            {others.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border p-3 text-right" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
                <Avatar index={i} name={p.name} />
                <span className="flex-1 font-bold" style={{ color: COLORS.text }}>{p.name}</span>
                <span className="text-xs" style={{ color: COLORS.muted }}>רמזים: {s.clues[p.id]}</span>
                {s.diagnosed[p.id] && <Check size={16} color={COLORS.emerald} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {s.phase === "result" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={48} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name} סיים/ה עם {s.totalScore} נקודות</div>
          <Btn variant="primary" onClick={onBack}><Home size={18} /> חזרה למרכז המשחקים</Btn>
        </div>
      )}
    </div>
  );
}

function HostPodium({ room, dispatch, onExit }) {
  return (
    <Podium
      players={room.players}
      actions={
        <div className="space-y-2.5">
          <Btn full variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}><RefreshCw size={18} /> סיבוב נוסף</Btn>
          <Btn full variant="ghost" onClick={onExit}><LogOut size={18} /> סגירת החדר</Btn>
        </div>
      }
    />
  );
}

function HostApp({ onExit }) {
  const [roomCode] = useState(() => generateRoomCode());
  const [room, localDispatch] = useReducer(roomReducer, null, createInitialRoom);
  const channelRef = useRef(null);

  useEffect(() => {
    const ch = createRoomChannel(roomCode);
    channelRef.current = ch;
    const unsub = ch.subscribe((msg) => {
      if (msg.type === "ACTION") localDispatch(msg.action);
    });
    return () => { unsub(); ch.close(); };
  }, [roomCode]);

  useEffect(() => {
    channelRef.current?.send({ type: "STATE", room });
  }, [room]);

  useEffect(() => {
    const activeKey = ["whoami", "alias"].find((k) => room.screen === k && room[k]?.phase === "playing");
    if (!activeKey) return;
    const t = setTimeout(() => localDispatch({ type: "TICK", game: activeKey }), 1000);
    return () => clearTimeout(t);
  }, [room]);

  const backToHub = () => localDispatch({ type: "BACK_TO_HUB" });

  return (
    <>
      {room.screen === "lobby" && <HostLobby room={room} dispatch={localDispatch} roomCode={roomCode} onExit={onExit} />}
      {room.screen === "hub" && <HostHub room={room} dispatch={localDispatch} onPodium={() => localDispatch({ type: "GO_PODIUM" })} />}
      {room.screen === "whoami" && <HostWhoAmI room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "shrink" && <HostShrink room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "alias" && <HostAlias room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "podium" && <HostPodium room={room} dispatch={localDispatch} onExit={onExit} />}
    </>
  );
}

function PlayerWaiting({ room, myName, label }) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <Sparkles size={36} color={COLORS.purple} />
      <div>
        <div className="text-lg font-black" style={{ color: COLORS.text }}>מחוברים בתור {myName}! 🍌</div>
        <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>{label}</p>
      </div>
      <div className="text-xs" style={{ color: COLORS.muted }}>{room.players.length} שחקנים בחדר כרגע</div>
    </div>
  );
}

function PlayerWhoAmI({ room, dispatch, myId }) {
  const w = room.whoami;
  const turnPlayer = room.players[w.turnIdx];
  const isGuesser = turnPlayer?.id === myId;

  if (w.phase === "ready") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Timer size={36} color={COLORS.purple} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>
          {isGuesser ? "התור שלך מתחיל עוד רגע!" : `התור של ${turnPlayer.name} מתחיל עוד רגע`}
        </div>
        <p className="text-sm" style={{ color: COLORS.muted }}>{isGuesser ? "אתם לא תראו כלום — כולם סביבכם יתארו." : "התכוננו לתאר בלי להגיד את המילים על הכרטיס."}</p>
      </div>
    );
  }

  if (w.phase === "turnEnd") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Trophy size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>הסיבוב הזה הסתיים!</div>
        <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יתחיל את התור הבא...</p>
      </div>
    );
  }

  if (isGuesser) {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-2xl font-black" style={{ color: COLORS.amber }}>⏱ {w.timeLeft}</div>
        <div className="rounded-3xl border-2 border-dashed p-8" style={{ borderColor: COLORS.purple, background: `${COLORS.purple}1a` }}>
          <div className="text-lg font-black leading-relaxed" style={{ color: COLORS.text }}>
            כולם רואים את הדמות שלך חוץ ממך - התחל לנחש!
          </div>
        </div>
        <div className="flex gap-6 text-sm font-bold">
          <span style={{ color: COLORS.emerald }}>✓ {w.correct}</span>
          <span style={{ color: COLORS.coral }}>⏭ {w.skips}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center text-lg font-black" style={{ color: COLORS.amber }}>⏱ {w.timeLeft}</div>
      <PartyCard big stampColor={COLORS.purple} stampLabel="מי אני?">{w.deck[w.cursor]}</PartyCard>
      <div className="grid w-full grid-cols-2 gap-3">
        <Btn variant="danger" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "skip", cursor: w.cursor })}><SkipForward size={18} /> דלג</Btn>
        <Btn variant="primary" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "correct", cursor: w.cursor })}><ThumbsUp size={18} /> הצליח/ה!</Btn>
      </div>
    </div>
  );
}

function PlayerAlias({ room, dispatch, myId }) {
  const a = room.alias;
  const turnPlayer = room.players[a.turnIdx];
  const isDescriber = turnPlayer?.id === myId;
  const [dragX, setDragX] = useState(0);

  if (a.phase === "ready") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Timer size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>
          {isDescriber ? "התור שלך להסביר מתחיל עוד רגע!" : `התור של ${turnPlayer.name} להסביר מתחיל עוד רגע`}
        </div>
      </div>
    );
  }

  if (a.phase === "turnEnd") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Trophy size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>הסיבוב הזה הסתיים!</div>
        <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יתחיל את התור הבא...</p>
      </div>
    );
  }

  if (isDescriber) {
    const advance = (isCorrect) => {
      dispatch({ type: "RESULT", game: "alias", result: isCorrect ? "correct" : "skip", cursor: a.cursor });
      setDragX(0);
    };
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
        <div className="text-center text-2xl font-black" style={{ color: COLORS.emerald }}>{a.correct}</div>
        <motion.div
          className="w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDrag={(_, info) => setDragX(info.offset.x)}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) advance(true);
            else if (info.offset.x < -100) advance(false);
            else setDragX(0);
          }}
          animate={{ x: 0, rotate: dragX / 20 }}
          style={{ x: dragX }}
        >
          <PartyCard big stampColor={COLORS.amber} stampLabel="אליאס">{a.deck[a.cursor]}</PartyCard>
        </motion.div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Btn variant="subtle" onClick={() => advance(false)}><SkipForward size={18} /> דלג</Btn>
          <Btn variant="primary" onClick={() => advance(true)}><Target size={18} /> נכון! (+1)</Btn>
        </div>
        <p className="text-xs" style={{ color: COLORS.muted }}>אפשר גם להחליק ימינה או שמאלה</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="text-3xl font-black" style={{ color: COLORS.amber }}>⏱ {a.timeLeft}</div>
      <div className="text-lg font-black" style={{ color: COLORS.text }}>{turnPlayer.name} מסביר/ה — נחשו בקול!</div>
      <div className="flex gap-6 text-sm font-bold">
        <span style={{ color: COLORS.emerald }}>✓ {a.correct} נכונות בתור הזה</span>
      </div>
    </div>
  );
}

function PlayerShrink({ room, dispatch, myId }) {
  const s = room.shrink;
  const isPsych = s.psychId === myId;

  if (s.phase === "select") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Stethoscope size={36} color={COLORS.emerald} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>המנחה בוחר/ת מי מאבחן/ת...</div>
      </div>
    );
  }

  if (isPsych) {
    if (s.phase === "diagnose") {
      const others = room.players.filter((p) => p.id !== myId);
      return (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
          <div className="mb-4 text-center text-lg font-black" style={{ color: COLORS.text }}>לוח האבחון שלך</div>
          <p className="mb-4 text-center text-xs" style={{ color: COLORS.muted }}>לכל שחקן/ית אפשר לבקש רמז (מוריד נקודה) ואז לנסות לאבחן.</p>
          <div className="space-y-3">
            {others.map((p, i) => (
              <GlassCard key={p.id} className={s.diagnosed[p.id] ? "opacity-60" : ""}>
                <div className="mb-2 flex items-center gap-3">
                  <Avatar index={i} name={p.name} />
                  <span className="flex-1 font-black" style={{ color: COLORS.text }}>{p.name}</span>
                  <span className="text-xs" style={{ color: COLORS.muted }}>רמזים: {s.clues[p.id]}</span>
                </div>
                <div className="flex gap-2">
                  <Btn variant="subtle" className="flex-1" disabled={s.diagnosed[p.id]} onClick={() => dispatch({ type: "SHRINK_CLUE", id: p.id })}><Lightbulb size={16} /> רמז</Btn>
                  <Btn variant="primary" className="flex-1" disabled={s.diagnosed[p.id]} onClick={() => dispatch({ type: "SHRINK_DIAGNOSE", id: p.id })}><Award size={16} /> {s.diagnosed[p.id] ? "אובחן/ה" : "לחשוף אבחנה"}</Btn>
                </div>
              </GlassCard>
            ))}
          </div>
          <div className="mt-6">
            <Btn full variant="primary" onClick={() => dispatch({ type: "SHRINK_FINISH" })}><Trophy size={18} /> סיום הסיבוב</Btn>
          </div>
        </div>
      );
    }
    if (s.phase === "result") {
      return (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-lg font-black" style={{ color: COLORS.text }}>סיימת עם {s.totalScore} נקודות!</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יעביר את כולם למרכז המשחקים...</p>
        </div>
      );
    }
  }

  const myRule = s.rules?.[myId];
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center text-sm font-bold" style={{ color: COLORS.muted }}>הכלל הסודי שלך — אף אחד אחר לא רואה את זה</div>
      <PartyCard stampColor={COLORS.emerald} stampLabel="הכלל הסודי שלך">{myRule || "מחכים שהמנחה יקצה כלל..."}</PartyCard>
      <p className="text-xs" style={{ color: COLORS.muted }}>פעלו לפי הכלל הזה בלי לחשוף אותו — הפסיכולוג/ית ינסה/תנסה לגלות</p>
    </div>
  );
}

function PlayerApp({ roomCode, name, traits, onExit }) {
  const [myId] = useState(() => generateId());
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    const ch = createRoomChannel(roomCode);
    channelRef.current = ch;
    const unsub = ch.subscribe((msg) => {
      if (msg.type === "STATE") {
        setRoom(msg.room);
        setConnecting(false);
      }
    });
    ch.send({ type: "ACTION", action: { type: "JOIN", id: myId, name, traits } });
    const timeout = setTimeout(() => setConnecting(false), 6000);
    return () => { unsub(); ch.close(); clearTimeout(timeout); };
  }, [roomCode]);

  const dispatch = useCallback((action) => channelRef.current?.send({ type: "ACTION", action }), []);

  if (!room) {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo />
        {connecting ? (
          <>
            <Wifi size={32} color={COLORS.purple} />
            <div className="text-sm font-bold" style={{ color: COLORS.text }}>מתחברים לחדר {roomCode}...</div>
          </>
        ) : (
          <>
            <WifiOff size={32} color={COLORS.coral} />
            <div className="text-sm font-bold" style={{ color: COLORS.text }}>לא הצלחנו להתחבר</div>
            <p className="text-xs" style={{ color: COLORS.muted }}>
              ודאו שקוד החדר נכון וכי מסך המנחה פתוח.
            </p>
            <Btn variant="ghost" onClick={onExit}>חזרה</Btn>
          </>
        )}
      </div>
    );
  }

  if (room.screen === "lobby") return <PlayerWaiting room={room} myName={name} label="ממתינים שהמנחה יתחיל את הערב..." />;
  if (room.screen === "hub") return <PlayerWaiting room={room} myName={name} label="המנחה בוחר/ת משחק..." />;
  if (room.screen === "whoami") return <PlayerWhoAmI room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "shrink") return <PlayerShrink room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "alias") return <PlayerAlias room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "podium") return <Podium players={room.players} actions={<p className="text-center text-xs" style={{ color: COLORS.muted }}>ממתינים שהמנחה יחליט מה הלאה...</p>} />;
  return null;
}

export default function App() {
  const [mode, setMode] = useState("entry");
  const [joinInfo, setJoinInfo] = useState(null);
  const [prefillCode] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("join") || "";
  });

  const exitToEntry = () => { setMode("entry"); setJoinInfo(null); };

  return (
    <div dir="rtl" lang="he" className="min-h-screen w-full" style={{ background: COLORS.bg, fontFamily: "Heebo, Rubik, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;800;900&family=Heebo:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        body { background: ${COLORS.bg}; }
      `}</style>
      <GlowBG />

      {mode === "entry" && (
        <EntryScreen
          prefillCode={prefillCode}
          onHost={() => setMode("host")}
          onJoin={(info) => { setJoinInfo(info); setMode("player"); }}
        />
      )}
      {mode === "host" && <HostApp onExit={exitToEntry} />}
      {mode === "player" && joinInfo && <PlayerApp {...joinInfo} onExit={exitToEntry} />}
    </div>
  );
}