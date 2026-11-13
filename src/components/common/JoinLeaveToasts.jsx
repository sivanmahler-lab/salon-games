import React, { useEffect, useRef, useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { COLORS } from "../../constants/theme";

/* Shows a short message when someone joins ("X הצטרף/ה") or leaves ("X עזב/ה"), on every screen. */
export default function JoinLeaveToasts({ players }) {
  const prev = useRef(null);
  const [items, setItems] = useState([]);
  useEffect(() => {
    const before = prev.current;
    prev.current = players;
    if (!before) return;
    const ids = new Set(players.map((p) => p.id));
    const old = new Set(before.map((p) => p.id));
    // a player whose phone reconnected keeps the name but gets a new id: that is neither a join nor a leave
    const names = new Set(players.map((p) => p.name));
    const oldNames = new Set(before.map((p) => p.name));
    const fresh = [
      ...players.filter((p) => !old.has(p.id) && !oldNames.has(p.name)).map((p) => ({ k: "join", name: p.name })),
      ...before.filter((p) => !ids.has(p.id) && !names.has(p.name)).map((p) => ({ k: "leave", name: p.name })),
    ].map((x, i) => ({ ...x, id: Date.now() + i }));
    if (!fresh.length) return;
    setItems((cur) => [...cur, ...fresh].slice(-3));
    fresh.forEach((x) => setTimeout(() => setItems((cur) => cur.filter((y) => y.id !== x.id)), 4500));
  }, [players]);
  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[99] flex flex-col items-center gap-2 px-4">
      {items.map((x) => (
        <div key={x.id} role="status" className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black shadow-lg" style={{ background: COLORS.surface, borderColor: x.k === "join" ? COLORS.emerald : COLORS.coral, color: x.k === "join" ? COLORS.emerald : COLORS.coral }}>
          {x.k === "join" ? <UserPlus size={16} /> : <UserMinus size={16} />}
          {x.name} {x.k === "join" ? "הצטרף/ה" : "עזב/ה"}
        </div>
      ))}
    </div>
  );
}
