import React, { useState } from "react";
import { QrCode, Wifi } from "lucide-react";
import { COLORS, TRAIT_TAGS } from "../../constants/theme";
import { Logo, GlassCard, Chip, Btn } from "../common/UIComponents";

export default function EntryScreen({ onHost, onJoin, prefillCode }) {
  const [sub, setSub] = useState(prefillCode ? "join" : "choose");
  const [code, setCode] = useState(prefillCode || "");
  const [name, setName] = useState("");
  const [traits, setTraits] = useState([]);

  const toggleTrait = (t) => setTraits((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));
  const canJoin = code.trim().length > 0 && name.trim().length > 0;

  if (sub === "join") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 flex justify-center"><Logo size="text-3xl" /></div>
        <GlassCard className="space-y-4">
          <div className="text-center text-lg font-black" style={{ color: COLORS.text }}>הצטרפות מהטלפון שלכם</div>
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: COLORS.muted }}>קוד החדר</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="לדוגמה: אב1234"
              className="w-full rounded-xl border bg-transparent px-3.5 py-3 text-center text-lg font-black tracking-widest outline-none focus:border-[#a855f7]"
              style={{ borderColor: COLORS.border, color: COLORS.text }}
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: COLORS.muted }}>השם שלכם</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="איך קוראים לכם?"
              className="w-full rounded-xl border bg-transparent px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#a855f7]"
              style={{ borderColor: COLORS.border, color: COLORS.text }}
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: COLORS.muted }}>תכונות (אופציונלי, אפשר כמה)</div>
            <div className="flex flex-wrap gap-1.5">
              {TRAIT_TAGS.map((t) => (
                <Chip key={t} label={t} active={traits.includes(t)} onClick={() => toggleTrait(t)} color={COLORS.emerald} />
              ))}
            </div>
          </div>
          <Btn full variant="primary" disabled={!canJoin} onClick={() => onJoin({ roomCode: code.trim(), name: name.trim(), traits })}>
            <Wifi size={18} /> הצטרפות לחדר
          </Btn>
          <button onClick={() => setSub("choose")} className="w-full text-center text-xs font-bold" style={{ color: COLORS.muted }}>חזרה</button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <Logo size="text-4xl" />
      <p className="text-sm" style={{ color: COLORS.muted }}>
        מכשיר אחד מארח את הערב (המסך הראשי), וכל השאר מצטרפים מהטלפונים שלהם.
      </p>
      <div className="w-full space-y-3">
        <Btn full variant="primary" onClick={onHost}><QrCode size={18} /> אירוח ערב — המסך הראשי</Btn>
        <Btn full variant="gold" onClick={() => setSub("join")}><Wifi size={18} /> הצטרפות מהטלפון שלי</Btn>
      </div>
      <p className="text-[11px]" style={{ color: COLORS.muted }}>
        לבדיקה מקומית: פתחו את שני המצבים בכרטיסיות שונות באותו דפדפן — הם מתסנכרנים באופן מיידי.
      </p>
    </div>
  );
}
