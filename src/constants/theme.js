import { Users, Flame, Star, PartyPopper, Zap, Brain, Stethoscope } from "lucide-react";

/* ============================================================================
   SALON (סלון) — theme & static config
============================================================================ */

export const COLORS = {
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

export const CATEGORIES = [
  { id: "friday", label: "ערב שישי", icon: Flame },
  { id: "holiday", label: "חג משפחתי", icon: Star },
  { id: "birthday", label: "יום הולדת", icon: PartyPopper },
  { id: "friends", label: "ערב חברים", icon: Users },
];

export const SPICE_LEVELS = [
  { id: 1, label: "מתוק ומשפחתי", desc: "עדין, מתאים לכולם", color: COLORS.emerald },
  { id: 2, label: "עוקצני במידה", desc: "קצת עקיצות, בלי לפגוע", color: COLORS.amber },
  { id: 3, label: "רוסט מלא", desc: "בלי רחמים", color: COLORS.coral },
];

export const TRAIT_TAGS = [
  "תמיד מאחר/ת", "מסור/ה לקפה", "מלך/ת המנגל", "בדיחות אבא",
  "חופר/ת בווייז", "שוכח/ת מפתחות", "מדבר/ת עם הידיים", "בוכה/ה בסרטים",
];

export const AVATAR_COLORS = [
  COLORS.emerald, COLORS.amber, COLORS.purple, COLORS.coral,
  "#38bdf8", "#f472b6", "#facc15", "#34d399",
];

export const GAME_DEFS = [
  { id: "whoami", title: "מי אני?", desc: "דמות מצחיקה — כולם רואים חוץ מהמנחש/ת", icon: Brain, color: COLORS.purple },
  { id: "shrink", title: "הפסיכולוג", desc: "כלל התנהגות סודי לכל אחד, אחד/ת מאבחן/ת", icon: Stethoscope, color: COLORS.emerald },
  { id: "alias", title: "אליאס סלון", desc: "60 שניות, מסבירים מילה בלי להגיד אותה", icon: Zap, color: COLORS.amber },
];
