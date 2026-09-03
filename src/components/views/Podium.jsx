import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Medal } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { Logo, GlassCard, Avatar, Confetti } from "../common/UIComponents";

export function computeBadges(players) {
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

export function PodiumStand({ player, place, index }) {
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

export function Podium({ players, actions }) {
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
      <p className="mb-8 text-center text-sm" style={{ color: COLORS.muted }}>ערב בלתי נשכח, רשמית</p>

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
