import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Trash2, Flame, Star, PartyPopper, Zap, Sparkles,
  Timer, ThumbsUp, SkipForward, Brain, Stethoscope, DoorOpen, Eye, Lightbulb,
  Award, Trophy, Medal, Crown, RefreshCw, Home, ArrowLeft,
  ChevronLeft, Check, Target, Gamepad2,
} from "lucide-react";

/* ============================================================================
   NANNO BANANA presents: SALON (סלון)
   Content generation engine — fully local, no external API required.
============================================================================ */

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
  { id: "whoami", title: "מי אני?", desc: "דמות מצחיקה על המצח — נחשו לפני שנגמר הזמן", icon: Brain, color: COLORS.purple },
  { id: "shrink", title: "הפסיכולוג", desc: "כלל התנהגות סודי, אחד/ת מאבחן/ת את כולם", icon: Stethoscope, color: COLORS.emerald },
  { id: "alias", title: "אליאס סלון", desc: "60 שניות, מסבירים מילה בלי להגיד אותה", icon: Zap, color: COLORS.amber },
];

/* ---------------------------- content datasets ---------------------------- */

const GENERIC_PERSONAS = [
  "כוכב/ת שכולם בטוחים שפגשו פעם באיזה אירוע",
  "מנחה טוקבק שתמיד קוטע את האורחים",
  "זמר/ת שכל שיר חדש שלו נשמע כמו הקודם",
  "שחקן ראשי בסדרת דרמה שכולם צופים אבל אף אחד לא מודה",
  "יוטיובר/ית עם מיליוני עוקבים ואף אחד בסלון לא שמע עליו",
  "כוכב/ת ריאליטי שמככב/ת בכל תוכנית אפשרית",
  "שחקן כדורגל שתמיד 'כמעט' עבר לקבוצה גדולה בחו״ל",
  "פרשן ספורט שצועק יותר מהשחקנים על המגרש",
  "שף שמככב בתוכנית בישול ותמיד אומר 'זה חסר מלח'",
  "קומיקאי שהבדיחה שלו מלפני עשור עדיין רצה ברשתות",
  "זמרת שכל ראיון שלה הופך לכותרת ביום שאחרי",
  "שחקן שמככב בכל פרסומת בטלוויזיה השנה",
  "מגיש חדשות שנשאר רציני גם כשקורה משהו מצחיק בסטודיו",
  "בלוגר אוכל שמצלם את הצלחת לפני שהספיק לטעום",
  "רקדן מקצועי שמנצח כל תחרות שהוא משתתף בה",
  "מאמן כושר שהופך כל שיחה לפרסומת לתוכנית אימונים",
  "שדרן רדיו שמדבר מהר יותר מכל מי שמקשיב לו",
  "כוכב אינסטגרם שכל תמונה שלו מצולמת ב'זריקה ספונטנית'",
  "שחקן ותיק שכולם בטוחים שהוא כבר לא איתנו, והוא כן",
  "מגישת אירוויזיון שזוכרת כל שיר חוץ מהמנצח",
  "טוקבקיסט שמגיב לכל כתבה לפני שקרא אותה",
  "פודקאסטר שהפרק שלו תמיד חורג בשעה שלמה",
  "משפיען כושר שמצלם כל חזרה באימון לסטוריז",
  "מגישת בישול ש'שוכחת' תבלין אחד בכוונה בכל פרק",
  "שחקן טניס שצועק יותר מדי אחרי כל מכה",
  "כוכב טיקטוק שההורים שלו עדיין לא הבינו מה הוא עושה",
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

/* ------------------------------ helpers ------------------------------ */

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
  const generic = pick(GENERIC_PERSONAS, Math.max(10, players.length + 8));
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

/* ============================================================================
   Shared UI atoms
============================================================================ */

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
    <div
      className={`rounded-3xl border p-5 backdrop-blur-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", borderColor: COLORS.border }}
    >
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

function TopBar({ title, onBack, right }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
        <Home size={16} />
        מרכז המשחקים
      </button>
      <div className="text-sm font-bold" style={{ color: COLORS.text }}>{title}</div>
      <div className="min-w-[80px] text-left text-sm font-bold" style={{ color: COLORS.amber }}>{right}</div>
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

/* ============================================================================
   LOBBY
============================================================================ */

function PlayerCard({ player, index, onUpdate, onRemove, removable }) {
  const toggleTrait = (t) => {
    const has = player.traits.includes(t);
    onUpdate(player.id, { traits: has ? player.traits.filter((x) => x !== t) : [...player.traits, t] });
  };
  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar index={index} name={player.name} />
        <input
          placeholder={`שם שחקן/ית ${index + 1} (חובה)`}
          value={player.name}
          onChange={(e) => onUpdate(player.id, { name: e.target.value })}
          className="flex-1 rounded-xl border bg-transparent px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#a855f7]"
          style={{ borderColor: COLORS.border, color: COLORS.text }}
        />
        {removable && (
          <button onClick={() => onRemove(player.id)} className="shrink-0" style={{ color: COLORS.coral }}>
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <div>
        <div className="mb-1.5 text-[11px] font-bold" style={{ color: COLORS.muted }}>תכונות (אופציונלי, אפשר כמה)</div>
        <div className="flex flex-wrap gap-1.5">
          {TRAIT_TAGS.map((t) => (
            <Chip key={t} label={t} active={player.traits.includes(t)} onClick={() => toggleTrait(t)} color={COLORS.emerald} />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function Lobby({ onLaunch }) {
  const [players, setPlayers] = useState([
    { id: generateId(), name: "", traits: [] },
    { id: generateId(), name: "", traits: [] },
    { id: generateId(), name: "", traits: [] },
  ]);
  const [category, setCategory] = useState("friends");
  const [spice, setSpice] = useState(2);
  const [enabledGames, setEnabledGames] = useState(GAME_DEFS.map((g) => g.id));

  const updatePlayer = (id, patch) => setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const addPlayer = () => players.length < 10 && setPlayers((ps) => [...ps, { id: generateId(), name: "", traits: [] }]);
  const removePlayer = (id) => setPlayers((ps) => (ps.length > 3 ? ps.filter((p) => p.id !== id) : ps));
  const toggleGame = (id) =>
    setEnabledGames((gs) => (gs.includes(id) ? gs.filter((g) => g !== id) : [...gs, id]));

  const namedCount = players.filter((p) => p.name.trim()).length;
  const canLaunch = namedCount >= 3 && enabledGames.length >= 1;

  const launch = () => {
    const finalPlayers = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `שחקן ${i + 1}`,
      score: 0,
      correct: 0,
      skips: 0,
      diagnosed: 0,
    }));
    onLaunch({ players: finalPlayers, category, spice, enabledGames });
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-8 md:max-w-2xl">
      <div className="mb-7 flex justify-center"><Logo size="text-3xl" /></div>

      <div className="space-y-7">
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: COLORS.muted }}>
            <PartyPopper size={16} /> קטגוריית הערב
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
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
          <div className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: COLORS.muted }}>
            <Flame size={16} /> רמת חריפות
          </div>
          <div className="space-y-2.5">
            {SPICE_LEVELS.map((s) => {
              const active = spice === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSpice(s.id)}
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
          <div className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: COLORS.muted }}>
            <Gamepad2 size={16} /> אילו משחקים בתוכנית?
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {GAME_DEFS.map((g) => {
              const Icon = g.icon;
              const active = enabledGames.includes(g.id);
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
            <Users size={16} /> מי מגיע הערב? (מינימום 3, שם בלבד חובה)
          </div>
          <div className="space-y-3">
            {players.map((p, i) => (
              <PlayerCard key={p.id} player={p} index={i} onUpdate={updatePlayer} onRemove={removePlayer} removable={players.length > 3} />
            ))}
          </div>
          {players.length < 10 && (
            <button onClick={addPlayer} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-3 text-sm font-bold" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
              <Plus size={16} /> הוסף שחקן/ית
            </button>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Btn full variant="primary" disabled={!canLaunch} onClick={launch}>
          <Sparkles size={18} /> צור לנו ערב בלתי נשכח
        </Btn>
        {!canLaunch && (
          <p className="mt-2 text-center text-[11px]" style={{ color: COLORS.muted }}>
            נדרשים שם ל-3 שחקנים לפחות ומשחק אחד לפחות פעיל
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   HUB
============================================================================ */

function Hub({ session, onEnter, onPodium, onNewLobby }) {
  const cat = CATEGORIES.find((c) => c.id === session.category)?.label;
  const spc = SPICE_LEVELS.find((s) => s.id === session.spice)?.label;
  const anyScore = session.players.some((p) => p.score > 0 || p.correct > 0 || p.skips > 0 || p.diagnosed > 0);
  const games = GAME_DEFS.filter((g) => session.enabledGames.includes(g.id));

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-8 md:max-w-xl">
      <div className="mb-6 flex justify-center"><Logo /></div>

      <GlassCard className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold" style={{ color: COLORS.muted }}>
        <span className="rounded-full px-2.5 py-1" style={{ background: COLORS.surfaceAlt }}>{cat}</span>
        <span className="rounded-full px-2.5 py-1" style={{ background: COLORS.surfaceAlt }}>{spc}</span>
        <span className="rounded-full px-2.5 py-1" style={{ background: COLORS.surfaceAlt }}>{session.players.length} שחקנים</span>
      </GlassCard>

      <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>המשחקים שלכם</div>
      <div className="space-y-3">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => onEnter(g.id)}
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

      <div className="mt-6 space-y-2.5">
        <Btn full variant="gold" disabled={!anyScore} onClick={onPodium}>
          <Trophy size={18} /> לוח התוצאות
        </Btn>
        <Btn full variant="ghost" onClick={onNewLobby}>
          <RefreshCw size={16} /> לובי חדש
        </Btn>
      </div>
    </div>
  );
}

/* ============================================================================
   GAME 1 — מי אני? (turn-based, score → active player)
============================================================================ */

function WhoAmIGame({ players, category, spice, onScoreUpdate, onBack }) {
  const [personaPool] = useState(() => buildPersonas(players, spice));
  const [deck, setDeck] = useState(() => shuffle(personaPool));
  const [turnIdx, setTurnIdx] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState("ready"); // ready | playing | turnEnd
  const [timeLeft, setTimeLeft] = useState(60);
  const [correct, setCorrect] = useState(0);
  const [skips, setSkips] = useState(0);
  const [flip, setFlip] = useState(false);
  const submitted = useRef(false);

  const current = players[turnIdx];

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      if (!submitted.current) {
        submitted.current = true;
        onScoreUpdate(current.id, { scoreDelta: correct, correctDelta: correct, skipDelta: skips });
      }
      setPhase("turnEnd");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const startTurn = () => {
    setDeck((d) => (d.length ? d : shuffle(personaPool)));
    setTimeLeft(60);
    setCorrect(0);
    setSkips(0);
    submitted.current = false;
    setPhase("playing");
  };

  const next = (isCorrect) => {
    if (isCorrect) setCorrect((s) => s + 1);
    else setSkips((s) => s + 1);
    setCursor((i) => (i + 1) % deck.length);
  };

  const nextTurn = () => {
    setTurnIdx((i) => (i + 1) % players.length);
    setPhase("ready");
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title="מי אני?" onBack={onBack} right={phase === "playing" ? `⏱ ${timeLeft}` : ""} />

      {phase === "ready" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Avatar index={turnIdx} name={current.name} />
          <div>
            <div className="text-xl font-black" style={{ color: COLORS.text }}>התור של {current.name}!</div>
            <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>
              תנו את הטלפון ל{current.name}. שאר החבורה מתארת, {current.name} מנחש/ת. 60 שניות על השעון.
            </p>
          </div>
          <Btn variant="primary" onClick={startTurn}><Timer size={18} /> התחילו תור</Btn>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-between text-sm font-bold" style={{ color: COLORS.muted }}>
            <span style={{ color: COLORS.emerald }}>✓ {correct}</span>
            <button onClick={() => setFlip((f) => !f)} className="flex items-center gap-1 text-xs">
              <RefreshCw size={14} /> סובב
            </button>
            <span style={{ color: COLORS.coral }}>⏭ {skips}</span>
          </div>
          <div style={{ transform: flip ? "rotate(180deg)" : "none" }} className="w-full">
            <PartyCard big stampColor={COLORS.purple} stampLabel="מי אני?">{deck[cursor]}</PartyCard>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            <Btn variant="danger" onClick={() => next(false)}><SkipForward size={18} /> דלג</Btn>
            <Btn variant="primary" onClick={() => next(true)}><ThumbsUp size={18} /> הצלחתי לגלות</Btn>
          </div>
        </div>
      )}

      {phase === "turnEnd" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{current.name} סיים/ה עם {correct} נקודות!</div>
          <div className="flex gap-6">
            <div><div className="text-2xl font-black" style={{ color: COLORS.emerald }}>{correct}</div><div className="text-xs" style={{ color: COLORS.muted }}>נכונות</div></div>
            <div><div className="text-2xl font-black" style={{ color: COLORS.coral }}>{skips}</div><div className="text-xs" style={{ color: COLORS.muted }}>דילוגים</div></div>
          </div>
          <Btn variant="primary" onClick={nextTurn}><ArrowLeft size={18} /> תור הבא: {players[(turnIdx + 1) % players.length].name}</Btn>
          <button onClick={onBack} className="text-xs font-bold" style={{ color: COLORS.muted }}>סיום המשחק וחזרה למרכז</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   GAME 2 — הפסיכולוג
============================================================================ */

function ShrinkGame({ players, onScoreUpdate, onBack }) {
  const [phase, setPhase] = useState("select"); // select | leave | reveal | diagnose | result
  const [psychId, setPsychId] = useState(null);
  const [pool, setPool] = useState([]);
  const [revealIdx, setRevealIdx] = useState(0);
  const [showingCard, setShowingCard] = useState(false);
  const [suspects, setSuspects] = useState({});
  const [burst, setBurst] = useState(0);
  const submitted = useRef(false);

  const psych = players.find((p) => p.id === psychId);
  const others = players.filter((p) => p.id !== psychId);

  const beginAssign = () => {
    setPool(buildShrinkPool(others));
    const s = {};
    others.forEach((p) => (s[p.id] = { clues: 0, diagnosed: false }));
    setSuspects(s);
    setRevealIdx(0);
    setShowingCard(false);
    submitted.current = false;
    setPhase("leave");
  };

  const useClue = (id) => setSuspects((s) => ({ ...s, [id]: { ...s[id], clues: s[id].clues + 1 } }));
  const diagnose = (id) => {
    setSuspects((s) => ({ ...s, [id]: { ...s[id], diagnosed: true } }));
    setBurst((b) => b + 1);
  };

  const diagnosedCount = Object.values(suspects).filter((s) => s.diagnosed).length;
  const totalScore = Object.values(suspects).reduce((acc, s) => acc + (s.diagnosed ? Math.max(1, 3 - s.clues) : 0), 0);

  useEffect(() => {
    if (phase === "result" && !submitted.current && psych) {
      submitted.current = true;
      onScoreUpdate(psych.id, { scoreDelta: totalScore, diagnosedDelta: diagnosedCount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <Confetti burstKey={burst} />
      <TopBar title="הפסיכולוג" onBack={onBack} right="" />

      {phase === "select" && (
        <div className="flex flex-1 flex-col gap-5">
          <div className="text-center">
            <Stethoscope size={40} color={COLORS.emerald} className="mx-auto" />
            <div className="mt-3 text-xl font-black" style={{ color: COLORS.text }}>מי מאבחן/ת הערב?</div>
            <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>בחרו שחקן/ית אחד/ת שייצא/תצא מהחדר. כולם האחרים יקבלו התנהגות סודית.</p>
          </div>
          <div className="space-y-2">
            {players.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPsychId(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right"
                style={{ borderColor: psychId === p.id ? COLORS.emerald : COLORS.border, background: psychId === p.id ? `${COLORS.emerald}1a` : COLORS.surface }}
              >
                <Avatar index={i} name={p.name} />
                <span className="flex-1 font-bold" style={{ color: COLORS.text }}>{p.name}</span>
                {psychId === p.id && <Check size={18} color={COLORS.emerald} />}
              </button>
            ))}
          </div>
          <Btn variant="primary" disabled={!psychId} onClick={beginAssign}><DoorOpen size={18} /> {psych?.name}, החוצה!</Btn>
        </div>
      )}

      {phase === "leave" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <DoorOpen size={48} color={COLORS.emerald} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name}, צא/י מהחדר לרגע 🚪</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>שאר השחקנים יקבלו עכשיו הוראה סודית, אחד/ת בכל פעם. כשכולם מוכנים — לחצו המשך.</p>
          <Btn variant="primary" onClick={() => setPhase("reveal")}>המשך <ArrowLeft size={18} /></Btn>
        </div>
      )}

      {phase === "reveal" && revealIdx < others.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          {!showingCard ? (
            <>
              <Eye size={40} color={COLORS.amber} />
              <div className="text-lg font-black" style={{ color: COLORS.text }}>תנו את הטלפון ל{others[revealIdx].name}</div>
              <Btn variant="primary" onClick={() => setShowingCard(true)}><Eye size={18} /> הצג/י לי את הסוד</Btn>
            </>
          ) : (
            <>
              <PartyCard stampColor={COLORS.emerald} stampLabel={`הסוד של ${others[revealIdx].name}`}>{pool[revealIdx]?.rule}</PartyCard>
              <Btn variant="primary" onClick={() => { setShowingCard(false); setRevealIdx((i) => i + 1); }}>הבנתי, תעבירו הלאה</Btn>
            </>
          )}
        </div>
      )}

      {phase === "reveal" && revealIdx >= others.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Sparkles size={44} color={COLORS.purple} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>כולם קיבלו את הסוד שלהם!</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>{psych?.name} יכול/ה לחזור לחדר ולהתחיל לאבחן.</p>
          <Btn variant="primary" onClick={() => setPhase("diagnose")}><Stethoscope size={18} /> תתחיל האבחון</Btn>
        </div>
      )}

      {phase === "diagnose" && (
        <div className="flex flex-1 flex-col gap-4">
          <p className="text-center text-sm" style={{ color: COLORS.muted }}>{psych?.name}, לכל שחקן/ית אפשר לבקש רמז (מוריד נקודה) ואז לנסות לאבחן.</p>
          <div className="space-y-3">
            {others.map((p, i) => {
              const s = suspects[p.id];
              return (
                <GlassCard key={p.id} className={s.diagnosed ? "opacity-60" : ""}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-black" style={{ color: COLORS.text }}>{p.name}</span>
                    <span className="text-xs" style={{ color: COLORS.muted }}>רמזים: {s.clues}</span>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="subtle" className="flex-1" disabled={s.diagnosed} onClick={() => useClue(p.id)}><Lightbulb size={16} /> רמז</Btn>
                    <Btn variant="primary" className="flex-1" disabled={s.diagnosed} onClick={() => diagnose(p.id)}><Award size={16} /> {s.diagnosed ? "אובחן/ה" : "לחשוף אבחנה"}</Btn>
                  </div>
                </GlassCard>
              );
            })}
          </div>
          <Btn variant="primary" onClick={() => setPhase("result")}><Trophy size={18} /> סיום הסיבוב</Btn>
        </div>
      )}

      {phase === "result" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={48} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name} סיים/ה עם {totalScore} נקודות</div>
          <Btn variant="primary" onClick={onBack}><Home size={18} /> חזרה למרכז המשחקים</Btn>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   GAME 3 — אליאס סלון (turn-based, score → active describer)
============================================================================ */

function AliasGame({ players, onScoreUpdate, onBack }) {
  const [deckPool] = useState(() => buildAliasDeck(players));
  const [deck, setDeck] = useState(() => shuffle(deckPool));
  const [turnIdx, setTurnIdx] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(60);
  const [correct, setCorrect] = useState(0);
  const [skips, setSkips] = useState(0);
  const [dragX, setDragX] = useState(0);
  const submitted = useRef(false);

  const current = players[turnIdx];

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      if (!submitted.current) {
        submitted.current = true;
        onScoreUpdate(current.id, { scoreDelta: correct, correctDelta: correct, skipDelta: skips });
      }
      setPhase("turnEnd");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const startTurn = () => {
    setDeck((d) => (d.length ? d : shuffle(deckPool)));
    setTimeLeft(60);
    setCorrect(0);
    setSkips(0);
    submitted.current = false;
    setPhase("playing");
  };

  const advance = (isCorrect) => {
    if (isCorrect) setCorrect((s) => s + 1);
    else setSkips((s) => s + 1);
    setCursor((i) => (i + 1) % deck.length);
    setDragX(0);
  };

  const nextTurn = () => {
    setTurnIdx((i) => (i + 1) % players.length);
    setPhase("ready");
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title="אליאס סלון" onBack={onBack} right={phase === "playing" ? `⏱ ${timeLeft}` : ""} />

      {phase === "ready" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Avatar index={turnIdx} name={current.name} />
          <div>
            <div className="text-xl font-black" style={{ color: COLORS.text }}>התור של {current.name} להסביר!</div>
            <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>60 שניות. {current.name} מסביר/ה בלי להגיד את המילה, כולם מנחשים.</p>
          </div>
          <Btn variant="primary" onClick={startTurn}><Timer size={18} /> התחילו תור</Btn>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-2xl font-black" style={{ color: COLORS.emerald }}>{correct}</div>
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
            <PartyCard big stampColor={COLORS.amber} stampLabel="אליאס">{deck[cursor]}</PartyCard>
          </motion.div>
          <div className="grid w-full grid-cols-2 gap-3">
            <Btn variant="subtle" onClick={() => advance(false)}><SkipForward size={18} /> דלג</Btn>
            <Btn variant="primary" onClick={() => advance(true)}><Target size={18} /> נכון! (+1)</Btn>
          </div>
          <p className="text-xs" style={{ color: COLORS.muted }}>אפשר גם להחליק את הכרטיס ימינה או שמאלה</p>
        </div>
      )}

      {phase === "turnEnd" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{current.name} צבר/ה {correct} נקודות!</div>
          <div className="text-xs" style={{ color: COLORS.muted }}>{skips} דילוגים בדרך</div>
          <Btn variant="primary" onClick={nextTurn}><ArrowLeft size={18} /> תור הבא: {players[(turnIdx + 1) % players.length].name}</Btn>
          <button onClick={onBack} className="text-xs font-bold" style={{ color: COLORS.muted }}>סיום המשחק וחזרה למרכז</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PODIUM & BADGES
============================================================================ */

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

function Podium({ players, onPlayAgain, onNewLobby }) {
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

      <div className="space-y-2.5">
        <Btn full variant="primary" onClick={onPlayAgain}><RefreshCw size={18} /> סיבוב נוסף</Btn>
        <Btn full variant="ghost" onClick={onNewLobby}><Home size={18} /> לובי חדש</Btn>
      </div>
    </div>
  );
}

/* ============================================================================
   ROOT APP
============================================================================ */

export default function App() {
  const [screen, setScreen] = useState("lobby"); // lobby | hub | whoami | shrink | alias | podium
  const [session, setSession] = useState(null); // { players, category, spice, enabledGames }

  const handleLaunch = (data) => {
    setSession(data);
    setScreen("hub");
  };

  const handleScoreUpdate = useCallback((playerId, delta) => {
    setSession((prev) => {
      if (!prev) return prev;
      const players = prev.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              score: p.score + (delta.scoreDelta || 0),
              correct: p.correct + (delta.correctDelta || 0),
              skips: p.skips + (delta.skipDelta || 0),
              diagnosed: p.diagnosed + (delta.diagnosedDelta || 0),
            }
          : p
      );
      return { ...prev, players };
    });
  }, []);

  const handleNewLobby = () => {
    setSession(null);
    setScreen("lobby");
  };

  return (
    <div dir="rtl" lang="he" className="min-h-screen w-full" style={{ background: COLORS.bg, fontFamily: "Heebo, Rubik, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;800;900&family=Heebo:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        body { background: ${COLORS.bg}; }
      `}</style>
      <GlowBG />

      <AnimatePresence mode="wait">
        {screen === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Lobby onLaunch={handleLaunch} />
          </motion.div>
        )}
        {screen === "hub" && session && (
          <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Hub session={session} onEnter={setScreen} onPodium={() => setScreen("podium")} onNewLobby={handleNewLobby} />
          </motion.div>
        )}
        {screen === "whoami" && session && (
          <motion.div key="whoami" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WhoAmIGame players={session.players} category={session.category} spice={session.spice} onScoreUpdate={handleScoreUpdate} onBack={() => setScreen("hub")} />
          </motion.div>
        )}
        {screen === "shrink" && session && (
          <motion.div key="shrink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ShrinkGame players={session.players} onScoreUpdate={handleScoreUpdate} onBack={() => setScreen("hub")} />
          </motion.div>
        )}
        {screen === "alias" && session && (
          <motion.div key="alias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AliasGame players={session.players} onScoreUpdate={handleScoreUpdate} onBack={() => setScreen("hub")} />
          </motion.div>
        )}
        {screen === "podium" && session && (
          <motion.div key="podium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Podium players={session.players} onPlayAgain={() => setScreen("hub")} onNewLobby={handleNewLobby} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}