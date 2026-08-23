import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Armchair, Users, Flame, Star, PartyPopper, Sparkles, ChevronLeft,
  ArrowRight, ArrowLeft, Plus, Trash2, Check, Copy, QrCode, Brain, MessageSquareQuote,
  Eye, Timer, Trophy, RotateCcw, Home, ThumbsUp, SkipForward, Lightbulb,
  Award, Tag, User, Zap, Stethoscope, DoorOpen, RefreshCw
} from "lucide-react";

/* ============================================================================
   SALON — Content Generation Engine
============================================================================ */

const THEMES = [
  { id: "friday", label: "ערב שישי", icon: Flame },
  { id: "holiday", label: "חג משפחתי", icon: Star },
  { id: "birthday", label: "יום הולדת", icon: PartyPopper },
  { id: "friends", label: "ערב חברים", icon: Users },
];

const SPICE_LEVELS = [
  { id: 1, label: "מתוק ומשפחתי", desc: "עדין, מתאים לכולם", color: "#10B981" },
  { id: 2, label: "עוקצני במידה", desc: "קצת עקיצות, בלי לפגוע", color: "#F59E0B" },
  { id: 3, label: "רוסט מלא", desc: "בלי רחמים", color: "#F43F5E" },
];

const TOPIC_TAGS = ["טיולים", "בישול", "סדרות", "כדורגל", "עבודה", "רכילות", "אוכל", "ילדים", "ספורט", "מוזיקה"];

const CATCHPHRASE_PRESETS = ["וואלה תשמע/י", "סמוך עליי", "אין מצב", "אמרתי לכם", "בקטנה", "דקה אני שם"];
const QUIRK_PRESETS = ["תמיד מאחר/ת", "מכור/ה לקפה", "מלך/ת המנגל", "בדיחות אבא", "חופר/ת בווייז", "שוכח/ת מפתחות"];

const GENERIC_PERSONAS = [
  "כוכב/ת שכולם בטוחים שפגשו פעם באיזה אירוע",
  "מנחה טוקבק שתמיד קוטע את האורחים",
  "זמר/ת שכל שיר חדש שלו נשמע כמו הקודם",
  "שחקן ראשי בסדרת דרמה שכולם צופים אבל אף אחד לא מודה",
  "יוטיובר/ית עם מיליוני עוקבים ואף אחד בסלון לא שמע עליו",
  "כוכב/ת ריאליטי שמככב/ת בכל תוכנית אפשרית",
  "שף שמככב בתוכנית בישול ותמיד אומר 'זה חסר מלח'",
  "מאמן כושר שהופך כל שיחה לפרסומת לתוכנית אימונים",
];

const PERSONA_TEMPLATES = {
  1: [
    "{name} כשהוא/היא מגיע/ה בזמן (אירוע נדיר)",
    "{name} מנסה לזכור איפה חנה/תה את הרכב",
    "{name} אחרי כוס קפה ראשונה בבוקר",
    "{name} כשכולם כבר מחכים לו/ה ליד הדלת",
  ],
  2: [
    "{name} כשהוא/היא אומר/ת '{catchphrase}' בפעם העשירית היום",
    "{name} עם ה{quirk} המפורסם שלו/ה",
    "{name} מסביר/ה למה איחר/ה, שוב",
  ],
  3: [
    "{name} שבטוח/ה שהמשפט '{catchphrase}' הוא בדיחה מקורית",
    "{name} עם ה{quirk} שכולם כבר מחקים מאחורי הגב",
    "{name} מספר/ת שוב את הסיפור שכולם כבר שמעו בעל פה",
  ],
};

const SHRINK_RULE_TEMPLATES = [
  "תתחיל/י כל משפט במילה 'בעצם' ותסביר/י יותר מדי",
  "תשלב/י את המילה '{tag}' בכל משפט שני שלך",
  "תחקה/י את ה{quirk} של עצמך בכל פעם שמישהו צוחק",
  "תגיד/י '{catchphrase}' לפחות פעם אחת בכל תשובה",
  "תענה/י על כל שאלה בשאלה נגדית, בלי לענות ישירות",
  "תדבר/י על עצמך בגוף שלישי, כל הזמן",
  "תסיים/י כל משפט במילים 'אתם מבינים אותי?'",
];

const ALIAS_GENERAL_WORDS = [
  "פיצה", "ים", "חתונה", "נדנדה", "מדינה", "גיטרה", "מטריה", "שוקולד", "רכבת", "חלום",
  "מראה", "גשר", "דבש", "כרטיס", "מנורה", "שיר", "מסיבה", "גלידה", "שעון", "קסם"
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

function generateRoomCode() {
  const letters = "אבגדהוזחטיכלמנסעפצקרשת";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${l1}${l2}-${num}`;
}

function fillTemplate(tpl, player, extra = {}) {
  return tpl
    .replace(/{name}/g, player?.name?.trim() || "מישהו כאן")
    .replace(/{catchphrase}/g, player?.catchphrase?.trim() || "סמוך עליי")
    .replace(/{quirk}/g, player?.quirk?.trim() || "ההרגל המצחיק שלו/ה")
    .replace(/{tag}/g, extra.tag || "הסלון")
    .replace(/{loreSnippet}/g, extra.loreSnippet || "הפעם ההיא בסלון");
}

function buildPersonas(players, spice) {
  const level = spice || 2;
  const templates = PERSONA_TEMPLATES[level] || PERSONA_TEMPLATES[1];
  const validPlayers = players.filter((p) => p.name.trim());
  const personalized = validPlayers.flatMap((p) => pick(templates, 2).map((t) => fillTemplate(t, p)));
  const generic = pick(GENERIC_PERSONAS, Math.max(8, validPlayers.length + 4));
  return shuffle([...personalized, ...generic]);
}

function buildShrinkPool(players, tags, loreText) {
  const validPlayers = players.filter((p) => p.name.trim());
  const loreSnippet = loreText ? loreText.trim().split(/\s+/).slice(0, 6).join(" ") : "";
  const templates = shuffle(SHRINK_RULE_TEMPLATES);
  return validPlayers.map((p, i) => {
    const tpl = templates[i % templates.length];
    const tag = tags.length ? tags[i % tags.length] : "בית";
    return { player: p, rule: fillTemplate(tpl, p, { tag, loreSnippet }) };
  });
}

function buildAliasDeck(players, tags, loreText) {
  const validPlayers = players.filter((p) => p.name.trim());
  const loreSnippet = loreText ? loreText.trim().split(/\s+/).slice(0, 5).join(" ") : "";
  const personal = validPlayers.map((p) => `ההרגל של ${p.name}`);
  const tagCards = tags.map((t) => `${t} של המשפחה`);
  const loreCard = loreText ? [`הסיפור על ${loreSnippet}`] : [];
  const personalPool = shuffle([...personal, ...tagCards, ...loreCard]);
  const chosenPersonal = personalPool.slice(0, 6);
  const chosenGeneral = pick(ALIAS_GENERAL_WORDS, 14);
  return shuffle([...chosenPersonal, ...chosenGeneral]);
}

/* UI Helpers */
const COLORS = {
  bg: "#0B1220",
  surface: "#141D33",
  surfaceAlt: "#1B2645",
  border: "#28324C",
  purple: "#8B5CF6",
  amber: "#F59E0B",
  emerald: "#10B981",
  coral: "#F43F5E",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

function GlowBG() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: COLORS.purple }} />
      <div className="absolute top-1/2 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: COLORS.amber }} />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, className = "", type = "button", full }) {
  const variants = {
    primary: "text-[#0B1220]",
    ghost: "bg-transparent border border-[#28324C] text-[#F1F5F9] hover:border-[#8B5CF6]",
    danger: "text-white",
    subtle: "bg-[#1B2645] text-[#F1F5F9] hover:bg-[#232F52]",
  };
  const bg = variant === "primary" ? { background: `linear-gradient(135deg, ${COLORS.purple}, #7C3AED)` } : variant === "danger" ? { background: COLORS.coral } : {};
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={bg}
      className={`${full ? "w-full" : ""} ${variants[variant]} inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-bold text-[15px] transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </button>
  );
}

function Chip({ label, active, onClick, color = COLORS.purple }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-semibold transition-all active:scale-95"
      style={{
        borderColor: active ? color : COLORS.border,
        background: active ? `${color}22` : "transparent",
        color: active ? color : COLORS.muted,
      }}
    >
      {label}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border p-5 ${className}`} style={{ background: COLORS.surface, borderColor: COLORS.border }}>
      {children}
    </div>
  );
}

function PartyCard({ children, rotate = -1.5, stampColor = COLORS.purple, stampLabel, big }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative w-full rounded-2xl border-2 border-dashed p-6 shadow-2xl shadow-black/40"
      style={{ background: "#F8F5EE", borderColor: "#D9D2BF", color: "#1A1A1A" }}
    >
      {stampLabel && (
        <div className="absolute -top-3 right-4 rotate-[6deg] rounded-md px-2 py-0.5 text-[11px] font-black tracking-wide text-white shadow" style={{ background: stampColor }}>
          {stampLabel}
        </div>
      )}
      <div className={`text-center font-black leading-snug ${big ? "text-3xl md:text-5xl" : "text-xl md:text-2xl"}`}>
        {children}
      </div>
    </motion.div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
        <Home size={16} /> מרכז המשחקים
      </button>
      <div className="text-sm font-bold" style={{ color: COLORS.text }}>{title}</div>
      <div className="w-[92px] text-left">{right}</div>
    </div>
  );
}

/* WIZARD */
function Wizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState("friends");
  const [spice, setSpice] = useState(2);
  const [players, setPlayers] = useState([
    { id: 1, name: "", catchphrase: "", quirk: "" },
    { id: 2, name: "", catchphrase: "", quirk: "" },
    { id: 3, name: "", catchphrase: "", quirk: "" },
  ]);
  const [loreText, setLoreText] = useState("");
  const [tags, setTags] = useState([]);

  const validNamesCount = players.filter((p) => p.name.trim()).length;
  const canQuickStart = validNamesCount >= 3;

  const update = (id, field, val) => setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  const addPlayer = () => setPlayers((ps) => [...ps, { id: Date.now(), name: "", catchphrase: "", quirk: "" }]);
  const removePlayer = (id) => setPlayers((ps) => (ps.length > 3 ? ps.filter((p) => p.id !== id) : ps));
  const toggleTag = (t) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const handleFinish = () => {
    onComplete({ theme, spice, players: players.filter((p) => p.name.trim()), loreText, tags });
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8 md:max-w-xl">
      <div className="mb-4 flex items-center justify-center gap-2">
        <Armchair size={26} color={COLORS.amber} />
        <span className="text-2xl font-black" style={{ color: COLORS.text }}>SALON <span style={{ color: COLORS.purple }}>סלון</span></span>
      </div>

      {canQuickStart && (
        <button
          type="button"
          onClick={handleFinish}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black shadow-lg"
          style={{ background: `linear-gradient(135deg, ${COLORS.amber}, #D97706)`, color: "#0B1220" }}
        >
          <Zap size={18} /> דלג ישר למשחק ⚡
        </button>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-400">שמות המשתתפים (מינימום 3)</div>
          {players.map((p, i) => (
            <Card key={p.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: COLORS.purple }}>שחקן/ית {i + 1}</span>
                {players.length > 3 && (
                  <button onClick={() => removePlayer(p.id)} className="text-rose-400"><Trash2 size={14} /></button>
                )}
              </div>
              <input
                placeholder="שם (חובה)"
                value={p.name}
                onChange={(e) => update(p.id, "name", e.target.value)}
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-purple-500"
                style={{ borderColor: COLORS.border, color: COLORS.text }}
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {QUIRK_PRESETS.map((q) => (
                  <Chip key={q} label={q} active={p.quirk === q} onClick={() => update(p.id, "quirk", p.quirk === q ? "" : q)} color={COLORS.amber} />
                ))}
              </div>
            </Card>
          ))}
          {players.length < 8 && (
            <button onClick={addPlayer} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-3 text-sm font-bold text-slate-400">
              <Plus size={16} /> הוסף שחקן/ית
            </button>
          )}
        </div>
      )}

      <div className="mt-6">
        <Btn full variant="primary" disabled={!canQuickStart} onClick={handleFinish}>
          צור לנו ערב בלתי נשכח 🚀
        </Btn>
      </div>
    </div>
  );
}

/* HUB */
function GameHub({ state, roomCode, onEnter, onRestart }) {
  const games = [
    { id: "whoami", title: "מי אני? מול המצח", desc: "דמויות וכוכבים — 60 שניות", icon: Brain, color: COLORS.purple },
    { id: "shrink", title: "הפסיכולוג: חדר אבחון", desc: "התנהגות סודית לכל שחקן", icon: Stethoscope, color: COLORS.emerald },
    { id: "alias", title: "אליאס משפחתי", desc: "החלקה ימינה ושמאלה על זמן", icon: Zap, color: COLORS.amber },
  ];

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8 md:max-w-xl">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Armchair size={24} color={COLORS.amber} />
        <span className="text-xl font-black" style={{ color: COLORS.text }}>SALON <span style={{ color: COLORS.purple }}>סלון</span></span>
      </div>

      <Card className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="rounded-xl border px-4 py-2 text-lg font-black tracking-widest text-slate-100" style={{ borderColor: COLORS.border }}>
          {roomCode}
        </div>
        <div className="text-xs text-slate-400">קוד חדר למשחק משותף</div>
      </Card>

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
                <div className="font-black text-slate-100">{g.title}</div>
                <div className="text-xs text-slate-400">{g.desc}</div>
              </div>
              <ChevronLeft size={20} color={COLORS.muted} />
            </button>
          );
        })}
      </div>

      <button onClick={onRestart} className="mt-8 text-center text-xs font-bold text-slate-500">
        התחלה מחדש עם קבוצה אחרת
      </button>
    </div>
  );
}

/* GAME 1: WHO AM I */
function WhoAmIGame({ personas, onBack }) {
  const [deck, setDeck] = useState(() => shuffle(personas));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) { setPhase("done"); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const start = () => {
    setDeck(shuffle(personas));
    setIdx(0);
    setScore(0);
    setTimeLeft(60);
    setPhase("playing");
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title="מי אני?" onBack={onBack} right={phase === "playing" ? `⏱ ${timeLeft}` : ""} />
      {phase === "ready" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Brain size={48} color={COLORS.purple} />
          <div className="text-xl font-black text-slate-100">מוכנים למצח?</div>
          <Btn variant="primary" onClick={start}><Timer size={18} /> התחילו סיבוב</Btn>
        </div>
      )}
      {phase === "playing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-emerald-400 font-bold">ניקוד: {score}</div>
          <PartyCard big stampColor={COLORS.purple} stampLabel="מי אני?">{deck[idx]}</PartyCard>
          <div className="grid w-full grid-cols-2 gap-3">
            <Btn variant="danger" onClick={() => setIdx((i) => (i + 1) % deck.length)}><SkipForward size={18} /> דלג</Btn>
            <Btn variant="primary" onClick={() => { setScore((s) => s + 1); setIdx((i) => (i + 1) % deck.length); }}><ThumbsUp size={18} /> נכון!</Btn>
          </div>
        </div>
      )}
      {phase === "done" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={48} color={COLORS.amber} />
          <div className="text-xl font-black text-slate-100">הזמן נגמר! {score} נקודות</div>
          <Btn variant="primary" onClick={start}><RefreshCw size={18} /> שוב</Btn>
        </div>
      )}
    </div>
  );
}

/* GAME 2: SHRINK */
function ShrinkGame({ players, tags, loreText, onBack }) {
  const [phase, setPhase] = useState("select");
  const [psychId, setPsychId] = useState(null);
  const [pool, setPool] = useState([]);
  const [revealIdx, setRevealIdx] = useState(0);
  const [showingCard, setShowingCard] = useState(false);

  const psych = players.find((p) => p.id === psychId);
  const others = players.filter((p) => p.id !== psychId);

  const beginAssign = () => {
    setPool(buildShrinkPool(others, tags, loreText));
    setRevealIdx(0);
    setShowingCard(false);
    setPhase("reveal");
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title="הפסיכולוג" onBack={onBack} right="" />
      {phase === "select" && (
        <div className="space-y-4">
          <div className="text-center text-slate-200 font-black text-lg">בחרו את הפסיכולוג/ית:</div>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setPsychId(p.id)}
              className="flex w-full items-center justify-between rounded-2xl border p-4 text-right"
              style={{ borderColor: psychId === p.id ? COLORS.emerald : COLORS.border, background: COLORS.surface }}
            >
              <span className="font-bold text-slate-100">{p.name}</span>
              {psychId === p.id && <Check size={18} color={COLORS.emerald} />}
            </button>
          ))}
          <Btn variant="primary" full disabled={!psychId} onClick={beginAssign}>
            <DoorOpen size={18} /> {psych?.name}, צא/י מהחדר!
          </Btn>
        </div>
      )}
      {phase === "reveal" && revealIdx < others.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          {!showingCard ? (
            <>
              <Eye size={40} color={COLORS.amber} />
              <div className="text-lg font-black text-slate-100">העבירו ל{others[revealIdx].name}</div>
              <Btn variant="primary" onClick={() => setShowingCard(true)}><Eye size={18} /> הצג חוק סודי</Btn>
            </>
          ) : (
            <>
              <PartyCard stampColor={COLORS.emerald} stampLabel={`הסוד של ${others[revealIdx].name}`}>
                {pool[revealIdx]?.rule}
              </PartyCard>
              <Btn variant="primary" onClick={() => { setShowingCard(false); setRevealIdx((i) => i + 1); }}>הבנתי, הבא בתור</Btn>
            </>
          )}
        </div>
      )}
      {phase === "reveal" && revealIdx >= others.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Sparkles size={44} color={COLORS.purple} />
          <div className="text-xl font-black text-slate-100">{psych?.name} יכול/ה לחזור!</div>
          <Btn variant="primary" onClick={() => setPhase("select")}><RefreshCw size={18} /> סיבוב חדש</Btn>
        </div>
      )}
    </div>
  );
}

/* GAME 3: ALIAS */
function AliasGame({ players, tags, loreText, onBack }) {
  const buildDeck = useCallback(() => buildAliasDeck(players, tags, loreText), [players, tags, loreText]);
  const [deck, setDeck] = useState(buildDeck);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) { setPhase("done"); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const start = () => {
    setDeck(shuffle(buildDeck()));
    setIdx(0);
    setScore(0);
    setTimeLeft(60);
    setPhase("playing");
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title="אליאס" onBack={onBack} right={phase === "playing" ? `⏱ ${timeLeft}` : ""} />
      {phase === "ready" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Zap size={48} color={COLORS.amber} />
          <div className="text-xl font-black text-slate-100">60 שניות. תארו בלי להגיד את המילה!</div>
          <Btn variant="primary" onClick={start}><Timer size={18} /> התחילו</Btn>
        </div>
      )}
      {phase === "playing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-2xl font-black text-emerald-400">{score}</div>
          <PartyCard big stampColor={COLORS.amber} stampLabel="אליאס">{deck[idx]}</PartyCard>
          <div className="grid w-full grid-cols-2 gap-3">
            <Btn variant="danger" onClick={() => { setScore((s) => s - 1); setIdx((i) => (i + 1) % deck.length); }}><ArrowLeft size={18} /> דלג (-1)</Btn>
            <Btn variant="primary" onClick={() => { setScore((s) => s + 1); setIdx((i) => (i + 1) % deck.length); }}><ArrowRight size={18} /> נכון (+1)</Btn>
          </div>
        </div>
      )}
      {phase === "done" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={48} color={COLORS.amber} />
          <div className="text-xl font-black text-slate-100">{score} נקודות!</div>
          <Btn variant="primary" onClick={start}><RefreshCw size={18} /> שוב</Btn>
        </div>
      )}
    </div>
  );
}

/* ROOT APP */
export default function App() {
  const [screen, setScreen] = useState("wizard");
  const [gameState, setGameState] = useState(null);
  const [roomCode] = useState(generateRoomCode);

  const personas = useMemo(() => (gameState ? buildPersonas(gameState.players, gameState.spice) : []), [gameState]);

  return (
    <div dir="rtl" lang="he" className="min-h-screen w-full text-slate-100" style={{ background: COLORS.bg, fontFamily: "sans-serif" }}>
      <GlowBG />
      <AnimatePresence mode="wait">
        {screen === "wizard" && <Wizard onComplete={(d) => { setGameState(d); setScreen("hub"); }} />}
        {screen === "hub" && gameState && <GameHub state={gameState} roomCode={roomCode} onEnter={setScreen} onRestart={() => setScreen("wizard")} />}
        {screen === "whoami" && gameState && <WhoAmIGame personas={personas} onBack={() => setScreen("hub")} />}
        {screen === "shrink" && gameState && <ShrinkGame players={gameState.players} tags={gameState.tags} loreText={gameState.loreText} onBack={() => setScreen("hub")} />}
        {screen === "alias" && gameState && <AliasGame players={gameState.players} tags={gameState.tags} loreText={gameState.loreText} onBack={() => setScreen("hub")} />}
      </AnimatePresence>
    </div>
  );
}