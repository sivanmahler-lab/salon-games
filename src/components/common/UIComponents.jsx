import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Home, LogOut } from "lucide-react";
import { COLORS, AVATAR_COLORS } from "../../constants/theme";

export function GlowBG() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: COLORS.purple }} />
      <div className="absolute top-1/2 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: COLORS.amber }} />
      <div className="absolute -bottom-32 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: COLORS.emerald }} />
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, className = "", full }) {
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

export function Chip({ label, active, onClick, color = COLORS.purple }) {
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

export function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border p-5 backdrop-blur-xl ${className}`} style={{ background: "rgba(255,255,255,0.04)", borderColor: COLORS.border }}>
      {children}
    </div>
  );
}

export function PartyCard({ children, stampColor = COLORS.purple, stampLabel, big }) {
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

export function Avatar({ index, name }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-[#0b0f1a]" style={{ background: color }}>
      {(name || "").trim() ? name.trim()[0] : index + 1}
    </div>
  );
}

export function Confetti({ burstKey }) {
  const emojis = ["🎉", "✨", "🎊", "⭐", "🏆"];
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

export function HelpModal({ title, steps, onClose }) {
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

export function TopBar({ title, onBack, backLabel, right, helpTitle, helpSteps }) {
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

export function Logo({ size = "text-xl" }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${size} font-black tracking-tight`} style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>
        SALON <span style={{ color: COLORS.purple }}>סלון</span>
      </div>
    </div>
  );
}

// Renders a REAL, scannable QR code (via the `qrcode` package — client-side,
// no network call at runtime). Requires: npm install qrcode
export function QRCode({ text, size = 160 }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!text) return;
    import("qrcode")
      .then((QRCodeLib) => {
        if (cancelled || !canvasRef.current) return;
        return QRCodeLib.toCanvas(canvasRef.current, text, {
          width: size,
          margin: 1,
          color: { dark: "#0b0f1a", light: "#ffffff" },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [text, size]);

  if (failed) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-white p-3 text-center text-[11px] font-bold text-[#0b0f1a]"
        style={{ width: size, height: size }}
      >
        לא ניתן להציג QR — התקינו את החבילה "qrcode" (npm install qrcode)
      </div>
    );
  }

  return <canvas ref={canvasRef} className="rounded-lg bg-white p-3" style={{ width: size, height: size }} />;
}
