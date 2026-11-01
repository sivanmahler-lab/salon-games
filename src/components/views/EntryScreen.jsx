import React, { useState } from "react";
import { QrCode, Smartphone, Wifi, HelpCircle } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { Logo, GlassCard, Btn } from "../common/UIComponents";
import HowToPlay from "../common/HowToPlay";

export default function EntryScreen({ onHost, onJoin, onSolo, prefillCode }) {
  const [sub, setSub] = useState(prefillCode ? "join" : "choose");
  const [code, setCode] = useState(prefillCode || "");
  const [name, setName] = useState("");
  const [help, setHelp] = useState(false);

  const canJoin = code.trim().length > 0 && name.trim().length > 0;

  if (sub === "join") {
    return (
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-4">
        <div className="mb-4 flex justify-center"><Logo size="text-3xl" /></div>
        <GlassCard className="space-y-4">
          <div className="text-center text-lg font-black" style={{ color: COLORS.text }}>הצטרפות מהטלפון שלכם</div>
          <div>
            <label htmlFor="player-name" className="mb-2 block text-center text-lg font-black" style={{ color: COLORS.text }}>
              מה השם שלכם?
            </label>
            <input
              id="player-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="כתבו כאן את השם"
              maxLength={16}
              className="w-full rounded-2xl border-2 bg-transparent px-4 py-4 text-center text-2xl font-black outline-none focus:border-[#a855f7]"
              style={{ borderColor: name.trim() ? COLORS.emerald : COLORS.purple, color: COLORS.text, boxShadow: `0 0 0 4px ${COLORS.purple}33` }}
            />
          </div>
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
          <Btn full variant="primary" disabled={!canJoin} onClick={() => onJoin({ roomCode: code.trim(), name: name.trim(), traits: [] })}>
            <Wifi size={18} /> הצטרפות לחדר
          </Btn>
          <button onClick={() => setSub("choose")} className="w-full text-center text-xs font-bold" style={{ color: COLORS.muted }}>חזרה</button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 px-6 py-8 text-center">
      <Logo size="text-4xl" />
      <div className="space-y-2">
        <p className="text-lg font-black" style={{ color: COLORS.text }}>משחקי חברה לערב בסלון</p>
        <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>
          מי אני, הפסיכולוג ואליאס. מכשיר אחד מארח את הערב (מחשב או טלוויזיה), וכל השחקנים מצטרפים מהטלפונים שלהם. בלי התקנות.
        </p>
      </div>
      <div className="w-full space-y-3">
        <Btn full variant="primary" onClick={onHost}><QrCode size={18} /> אירוח ערב — המסך הראשי</Btn>
        <Btn full variant="gold" onClick={() => setSub("join")}><Wifi size={18} /> הצטרפות מהטלפון שלי</Btn>
        <Btn full variant="ghost" onClick={onSolo}><Smartphone size={18} /> טלפון אחד באמצע החדר</Btn>
      </div>
      <button onClick={() => setHelp(true)} className="flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black" style={{ borderColor: COLORS.purple, color: COLORS.text, background: `${COLORS.purple}1a` }}>
        <HelpCircle size={18} color={COLORS.purple} /> איך משחקים? הוראות לכל משחק
      </button>
      {help && <HowToPlay onClose={() => setHelp(false)} />}
    </div>
  );
}
