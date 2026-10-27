import React, { useState } from "react";
import { ChevronLeft, Home } from "lucide-react";
import { Zap, Brain, Stethoscope } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { ALIAS_WORDS, WHO } from "../../data/salonContent";
import { GlassCard, Logo } from "../common/UIComponents";
import AliasSolo from "./AliasSolo";
import WhoSolo from "./WhoSolo";
import PsySolo from "./PsySolo";

const GAMES = [
  { id: "alias", title: "אליאס", desc: "מסבירים מילה בלי להגיד אותה. הקבוצה מנחשת לפני שהזמן נגמר.", meta: "2–4 קבוצות · טיימר · ניקוד", icon: Zap, color: COLORS.amber },
  { id: "who", title: "מי אני", desc: "הקבוצה נותנת רמזים, אחד מנחש. מקצועות, אוכל, מקומות, ישראלים ועוד.", meta: "חמישה נושאים · טלפון אחד או כל אחד בטלפון שלו", icon: Brain, color: COLORS.purple },
  { id: "psy", title: "הפסיכולוג", desc: "אחד יוצא מהחדר, כולם מסכימים על חוק סודי, והוא צריך לגלות אותו מהתשובות.", meta: "20 חוקים · שאלות לדוגמה", icon: Stethoscope, color: COLORS.emerald },
];

const WHO_COUNT = Object.values(WHO).reduce((sum, list) => sum + list.length, 0);

/* The one-phone games: one phone in the middle of the room, and everyone around it. */
export default function SoloApp({ onExit }) {
  const [game, setGame] = useState(null); // null | alias | who | psy
  const backToHub = () => setGame(null);

  if (game === "alias") return <AliasSolo onBack={backToHub} />;
  if (game === "who") return <WhoSolo onBack={backToHub} />;
  if (game === "psy") return <PsySolo onBack={backToHub} />;

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-6 md:max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
          <Home size={16} /> חזרה
        </button>
        <Logo />
        <div className="w-[92px]" />
      </div>

      <h1 className="mt-4 text-3xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>משחקי סלון</h1>
      <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>טלפון אחד באמצע החדר, וכולם מסביב.</p>

      <div className="mt-6 space-y-3">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => setGame(g.id)}
              className="flex w-full items-center gap-4 rounded-2xl border p-4 text-right transition-all active:scale-[0.98]"
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.color}22` }}>
                <Icon size={22} color={g.color} />
              </div>
              <div className="flex-1">
                <div className="font-black" style={{ color: COLORS.text }}>{g.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>{g.desc}</div>
                <div className="mt-1 text-[11px]" style={{ color: g.color }}>{g.meta}</div>
              </div>
              <ChevronLeft size={20} color={COLORS.muted} />
            </button>
          );
        })}
      </div>

      <GlassCard className="mt-6 text-center text-xs" >
        <span style={{ color: COLORS.muted }}>{ALIAS_WORDS.length} מילים לאליאס · {WHO_COUNT} פריטים ל"מי אני"</span>
      </GlassCard>
    </div>
  );
}
