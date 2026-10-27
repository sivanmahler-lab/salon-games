import React from "react";
import { Minus, Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { TopBar } from "../common/UIComponents";

/* Shared pieces for the one-phone games, in the same look as the rest of the app. */

export function SoloScreen({ title, onBack, right, children, center }) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title={title} onBack={onBack} right={right} />
      <div className={`flex flex-1 flex-col ${center ? "items-center justify-center gap-5 text-center" : ""}`}>{children}</div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section className="mt-6">
      <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>{title}</div>
      {children}
    </section>
  );
}

export function Stepper({ value, onMinus, onPlus, minusLabel = "פחות", plusLabel = "עוד" }) {
  const btn = "flex h-11 w-11 items-center justify-center rounded-full border transition-all active:scale-95";
  return (
    <div className="flex items-center gap-4">
      <button className={btn} style={{ borderColor: COLORS.border, background: COLORS.surfaceAlt, color: COLORS.text }} onClick={onMinus} aria-label={minusLabel}>
        <Minus size={18} />
      </button>
      <output className="min-w-[2ch] text-center text-3xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>{value}</output>
      <button className={btn} style={{ borderColor: COLORS.border, background: COLORS.surfaceAlt, color: COLORS.text }} onClick={onPlus} aria-label={plusLabel}>
        <Plus size={18} />
      </button>
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, ariaLabel, maxLength, inputMode, className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={maxLength}
      inputMode={inputMode}
      className={`w-full rounded-xl border bg-transparent px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#a855f7] ${className}`}
      style={{ borderColor: COLORS.border, color: COLORS.text }}
    />
  );
}

// A row of score boxes; `now` marks the one whose turn it is.
export function ScoreStrip({ items, now = -1, color }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => {
        const active = i === now;
        return (
          <div
            key={i}
            className="grid min-w-[90px] flex-1 gap-0.5 rounded-2xl border px-3 py-2.5"
            style={{ borderColor: active ? color : COLORS.border, background: active ? `${color}33` : "rgba(255,255,255,0.04)" }}
          >
            <b className="text-2xl font-black tabular-nums" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>{it.value}</b>
            <span className="break-words text-xs" style={{ color: active ? COLORS.text : COLORS.muted }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Clock({ seconds }) {
  return (
    <div
      className="text-5xl font-black tabular-nums leading-none"
      style={{ color: seconds <= 10 ? COLORS.coral : COLORS.amber, fontFamily: "Rubik, sans-serif" }}
      aria-live="off"
    >
      {seconds}
    </div>
  );
}

export function BigNumber({ children, color }) {
  return (
    <div className="text-6xl font-black tabular-nums leading-none" style={{ color, fontFamily: "Rubik, sans-serif" }}>
      {children}
    </div>
  );
}

export function Lead({ children, color }) {
  return <span className="text-sm font-bold" style={{ color }}>{children}</span>;
}

export function Note({ children }) {
  return <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>{children}</p>;
}
