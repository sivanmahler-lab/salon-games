import { Users, Flame, Star, PartyPopper, Zap, Brain, Stethoscope, BookOpen, Ghost, Grid3x3 } from "lucide-react";

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
  sky: "#38bdf8",
  text: "#f4f6fb",
  muted: "#94a3b8",
};

export const CATEGORIES = [
  { id: "friday", label: "ערב שישי", icon: Flame },
  { id: "holiday", label: "חג משפחתי", icon: Star },
  { id: "birthday", label: "יום הולדת", icon: PartyPopper },
  { id: "friends", label: "ערב חברים", icon: Users },
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
  { id: "lexicon", title: "לקסיקון לועזי-עברי", desc: "מילה לועזית אחת, כולם ממציאים לה הגדרה, ומנחשים את האמיתית", icon: BookOpen, color: COLORS.sky },
  { id: "imposter", title: "המתחזה", desc: "כולם מקבלים מילה סודית חוץ ממתחזה אחד, ומנסים לחשוף אותו", icon: Ghost, color: COLORS.coral },
  { id: "boggle", title: "בוגל בעברית", desc: "לוח של 16 אותיות, 3 דקות, מי מוצא הכי הרבה מילים", icon: Grid3x3, color: COLORS.emerald },
];
