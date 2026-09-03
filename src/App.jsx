import React, { useState } from "react";
import { COLORS } from "./constants/theme";
import { GlowBG } from "./components/common/UIComponents";
import EntryScreen from "./components/views/EntryScreen";
import HostApp from "./components/views/HostView";
import PlayerApp from "./components/views/PlayerView";

export default function App() {
  const [mode, setMode] = useState("entry"); // entry | host | player
  const [joinInfo, setJoinInfo] = useState(null);
  const [prefillCode] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("join") || "";
  });

  const exitToEntry = () => {
    setMode("entry");
    setJoinInfo(null);
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
          onHost={() => setMode("host")}
          onJoin={(info) => {
            setJoinInfo(info);
            setMode("player");
          }}
        />
      )}
      {mode === "host" && <HostApp onExit={exitToEntry} />}
      {mode === "player" && joinInfo && <PlayerApp {...joinInfo} onExit={exitToEntry} />}
    </div>
  );
}
