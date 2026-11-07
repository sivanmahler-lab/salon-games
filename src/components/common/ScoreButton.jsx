import React, { useState } from "react";
import { Trophy, X, Settings, Sun, Moon, Type, Volume2, VolumeX } from "lucide-react";
import { COLORS } from "../../constants/theme";

/* A "ניקוד" button that floats on every screen and opens the current scores. */
export default function ScoreButton({ rows, title = "הניקוד עכשיו", className = "" }) {
  const [open, setOpen] = useState(false);
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-3 left-1/2 z-[66] flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${className}`}
        style={{ borderColor: COLORS.amber, background: COLORS.surface, color: COLORS.amber }}
      >
        <Trophy size={14} /> ניקוד
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85dvh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-3xl border p-5 md:rounded-3xl" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black" style={{ color: COLORS.text }}><Trophy size={18} color={COLORS.amber} /> {title}</div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5" style={{ background: COLORS.surfaceAlt, color: COLORS.muted }}><X size={16} /></button>
            </div>
            {sorted.length === 0 && <p className="text-sm" style={{ color: COLORS.muted }}>עוד אין ניקוד.</p>}
            {sorted.map((r, i) => (
              <div key={r.name + i} className="flex items-center gap-3 rounded-2xl border px-3 py-2" style={{ borderColor: i === 0 && r.score > 0 ? COLORS.amber : COLORS.border, background: COLORS.surfaceAlt }}>
                <span className="w-5 text-center text-sm font-black" style={{ color: COLORS.muted }}>{i + 1}</span>
                <span className="flex-1 truncate font-bold" style={{ color: COLORS.text }}>{r.name}</span>
                <span className="text-lg font-black" style={{ color: COLORS.amber }}>{r.score}</span>
              </div>
            ))}
            <button onClick={() => { setOpen(false); window.dispatchEvent(new Event("salon-settings")); }} className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
              <Settings size={13} /> הגדרות תצוגה (מצב בהיר, אותיות גדולות, צלילים)
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* Look settings: light / dark, large text, sound. */
export function SettingsButton({ prefs, onChange, showGear }) {
  const [open, setOpen] = useState(false);
  React.useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("salon-settings", h);
    return () => window.removeEventListener("salon-settings", h);
  }, []);
  const Row = ({ icon: Icon, label, on, k }) => (
    <button onClick={() => onChange(k, !on)} className="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-right" style={{ borderColor: on ? COLORS.purple : COLORS.border, background: on ? `${COLORS.purple}22` : COLORS.surfaceAlt, color: COLORS.text }}>
      <Icon size={18} /> <span className="flex-1 text-sm font-bold">{label}</span> <span className="text-xs font-black">{on ? "פועל" : "כבוי"}</span>
    </button>
  );
  return (
    <>
      {showGear && <button onClick={() => setOpen(true)} aria-label="הגדרות תצוגה" className="fixed bottom-3 right-3 z-[85] rounded-full border p-1.5" style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.muted }}>
        <Settings size={15} />
      </button>}
      {open && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-2 rounded-t-3xl border p-5 md:rounded-3xl" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <div className="mb-1 flex items-center justify-between">
              <div className="font-black" style={{ color: COLORS.text }}>הגדרות תצוגה</div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5" style={{ background: COLORS.surfaceAlt, color: COLORS.muted }}><X size={16} /></button>
            </div>
            <Row icon={prefs.light ? Sun : Moon} label="מצב בהיר" on={prefs.light} k="light" />
            <Row icon={Type} label="אותיות גדולות" on={prefs.large} k="large" />
            <Row icon={prefs.sound ? Volume2 : VolumeX} label="צלילים ורטט" on={prefs.sound} k="sound" />
          </div>
        </div>
      )}
    </>
  );
}
