import React, { useState } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { COLORS, GAME_DEFS } from "../../constants/theme";
import { Logo, GlassCard, Btn, Chip } from "../common/UIComponents";

/* A short, skippable screen after the start: the kind of evening and the number of players,
   and the games that fit them best. It only advises: nothing is locked. */

const COUNTS = [
  { id: 2, label: "2", n: 2 },
  { id: 3, label: "3–4", n: 4 },
  { id: 5, label: "5–8", n: 6 },
  { id: 9, label: "9 ויותר", n: 10 },
];
const VIBES = [
  { id: "friends", label: "חברים וצחוקים 😄" },
  { id: "family", label: "משפחתי, גם עם ילדים 👨‍👩‍👧" },
  { id: "couple", label: "זוג או שניים 💑" },
  { id: "calm", label: "רגוע, שיחה ומילים ☕" },
  { id: "competitive", label: "תחרותי ומטורף 🔥" },
];

// per game: fewest players, best range, and how well it fits each kind of evening (0–3, with a short reason)
const FIT = {
  whoami: { min: 2, best: [3, 8], v: { friends: [3, "דמויות מצחיקות והמון צחוקים"], family: [3, "כולם מכירים את הדמויות, גם הקטנים"], couple: [2, "כל אחד מנחש את הדמות של השני"], calm: [2, "קצב נעים בלי לחץ"], competitive: [2, "מי מנחש הכי מהר"] } },
  shrink: { min: 3, best: [4, 10], v: { friends: [3, "מצחיק לגלות את הכלל הסודי"], family: [1, "דורש קצת הבנה של התנהגות"], couple: [0, "צריך כמה שחקנים"], calm: [2, "שיחה ושאלות"], competitive: [1, ""] } },
  alias: { min: 2, best: [4, 10], v: { friends: [3, "מסבירים מילים בלי להגיד אותן, מלא לחץ וצחוק"], family: [3, "קל להסבר ומתאים לכולם"], couple: [3, "משחק מצוין לשניים"], calm: [1, ""], competitive: [3, "קבוצות מול קבוצות, שעון רץ"] } },
  lexicon: { min: 2, best: [4, 10], v: { friends: [2, "ממציאים הגדרות מצחיקות למילים לועזיות"], family: [1, "מילים לועזיות, פחות לילדים"], couple: [1, ""], calm: [3, "משחק מילים ושיחה בלי לחץ"], competitive: [2, "מי מצליח לבלבל את כולם"] } },
  imposter: { min: 3, best: [5, 10], v: { friends: [3, "לחשוף מי המתחזה, עם הרבה חשדות"], family: [2, "קל להבנה למי שקורא"], couple: [0, "צריך לפחות 3"], calm: [1, ""], competitive: [3, "חשדות, שקרים ותחבולות"] } },
  boggle: { min: 2, best: [2, 8], v: { friends: [2, "מרוץ אותיות מהיר"], family: [2, "אפשר לשחק יחד מכל גיל"], couple: [3, "דו-קרב מילים מושלם לשניים"], calm: [3, "שקט, מילים ומחשבה"], competitive: [3, "מי מוצא הכי הרבה מילים"] } },
};

export function recommend(count, vibe) {
  const n = COUNTS.find((c) => c.id === count)?.n || 4;
  return GAME_DEFS.map((g) => {
    const f = FIT[g.id];
    if (!f) return null;
    const [vs, why] = f.v[vibe] || [1, ""];
    const need = n < f.min;
    const fit = n >= f.best[0] && n <= f.best[1] ? 3 : n > f.best[1] ? 1.5 : 2;
    return { g, score: need ? -1 : vs * 2 + fit, why: need ? `צריך לפחות ${f.min} שחקנים` : why, blocked: need };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
}

export default function GuideScreen({ onDone, onSkip, onBack }) {
  const [count, setCount] = useState(null);
  const [vibe, setVibe] = useState(null);
  const ready = count && vibe;
  const recs = ready ? recommend(count, vibe) : [];
  const top = recs.filter((r) => !r.blocked).slice(0, 3);

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-4 px-6 py-6">
      <div className="flex justify-center"><Logo size="text-3xl" /></div>
      <div className="text-center text-xl font-black" style={{ color: COLORS.text }}>איזה ערב זה?</div>
      <p className="text-center text-sm" style={{ color: COLORS.muted }}>שתי שאלות קצרות, ונמליץ על המשחקים שהכי מתאימים. אפשר לדלג.</p>

      <GlassCard className="space-y-3">
        <div className="text-sm font-black" style={{ color: COLORS.text }}>כמה שחקנים?</div>
        <div className="flex flex-wrap gap-2">
          {COUNTS.map((c) => <Chip key={c.id} big label={c.label} active={count === c.id} onClick={() => setCount(c.id)} color={COLORS.amber} />)}
        </div>
        <div className="pt-1 text-sm font-black" style={{ color: COLORS.text }}>מה אופי המפגש?</div>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => <Chip key={v.id} big label={v.label} active={vibe === v.id} onClick={() => setVibe(v.id)} color={COLORS.purple} />)}
        </div>
      </GlassCard>

      {ready && (
        <GlassCard className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-black" style={{ color: COLORS.amber }}><Sparkles size={16} /> מומלץ לכם</div>
          {top.map(({ g, why }, i) => {
            const Icon = g.icon;
            return (
              <div key={g.id} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: i === 0 ? g.color : COLORS.border, background: i === 0 ? `${g.color}1a` : COLORS.surfaceAlt }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.color}22` }}><Icon size={20} color={g.color} /></div>
                <div className="flex-1">
                  <div className="font-black" style={{ color: COLORS.text }}>{g.title}{i === 0 ? " ⭐" : ""}</div>
                  {why && <div className="text-xs" style={{ color: COLORS.muted }}>{why}</div>}
                </div>
              </div>
            );
          })}
          {recs.some((r) => r.blocked) && (
            <p className="pt-1 text-[11px]" style={{ color: COLORS.muted }}>לא מתאימים למספר הזה: {recs.filter((r) => r.blocked).map((r) => r.g.title).join(", ")}.</p>
          )}
        </GlassCard>
      )}

      <Btn full variant="primary" onClick={onDone}>{ready ? <>מתחילים <ArrowLeft size={18} /></> : "המשך"}</Btn>
      {!ready && <button onClick={onSkip} className="text-center text-sm font-bold" style={{ color: COLORS.muted }}>דילוג</button>}
      <button onClick={onBack} className="text-center text-xs font-bold" style={{ color: COLORS.muted }}>חזרה</button>
    </div>
  );
}
