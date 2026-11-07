import React, { useState, useEffect } from "react";
import { COLORS } from "./constants/theme";
import { GlowBG } from "./components/common/UIComponents";
import EntryScreen from "./components/views/EntryScreen";
import HostApp from "./components/views/HostView";
import PlayerApp from "./components/views/PlayerView";
import SoloApp from "./components/solo/SoloApp";
import { SettingsButton } from "./components/common/ScoreButton";
import { loadPrefs, savePref, applyLook, setSoundOn } from "./utils/extras";

export default function App() {
  const [mode, setMode] = useState("entry"); // entry | host | player | solo
  const [joinInfo, setJoinInfo] = useState(null);
  const [hostKind, setHostKind] = useState("tv"); // tv | mirror
  const [resume, setResume] = useState(null); // a phone that takes over as host: { roomCode, room }
  const [prefs, setPrefs] = useState(() => { const p = loadPrefs(); applyLook(p.light); setSoundOn(p.sound); return p; });
  const changePref = (k, on) => {
    savePref(k, on);
    if (k === "sound") setSoundOn(on);
    if (k === "light") applyLook(on);
    setPrefs((p) => ({ ...p, [k]: on }));
  };
  // Large text scales the whole page; the host (TV) screen sizes itself by its own rule.
  useEffect(() => {
    if (mode === "host") return undefined;
    document.documentElement.style.fontSize = prefs.large ? "125%" : "";
    return () => { document.documentElement.style.fontSize = ""; };
  }, [prefs.large, mode]);
  const [prefillCode] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("join") || "";
  });

  const exitToEntry = () => {
    setMode("entry");
    setJoinInfo(null);
    setResume(null);
  };

  return (
    <div
      dir="rtl"
      lang="he"
      className="min-h-screen w-full"
      style={{ background: COLORS.bg, fontFamily: "Heebo, Rubik, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;800;900&family=Heebo:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        body { background: ${COLORS.bg}; }
      `}</style>
      <GlowBG />

      {mode === "entry" && (
        <EntryScreen
          prefillCode={prefillCode}
          onHost={(kind) => { setHostKind(kind || "tv"); setMode("host"); }}
          onSolo={() => setMode("solo")}
          onJoin={(info) => {
            setJoinInfo(info);
            setMode("player");
          }}
        />
      )}
      {mode === "host" && <HostApp onExit={exitToEntry} kind={hostKind} resume={resume} />}
      <SettingsButton prefs={prefs} onChange={changePref} showGear={mode === "entry"} />
      {mode === "solo" && <SoloApp onExit={exitToEntry} />}
      {mode === "player" && joinInfo && <PlayerApp {...joinInfo} onExit={exitToEntry} onTakeover={(r) => { setResume(r); setJoinInfo(null); setMode("host"); }} />}
    </div>
  );
}
