import React from "react";
import { Play, Pause, SkipForward, ThumbsUp, ArrowLeft, Home, Trophy, Sparkles, RefreshCw, Stethoscope } from "lucide-react";
import { COLORS, GAME_DEFS } from "../../constants/theme";
import { Btn, Avatar } from "../common/UIComponents";

/* Host remote: lets one phone press the host buttons (start the evening, pick a game, start a turn,
   "got it" / "skip", pause, next turn), so nobody has to walk up to the TV or use its remote.
   It sends the same actions the host screen would. It never shows a secret (no cards, no rules). */

const wrap = "relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col gap-3 overflow-hidden px-5 pb-16 pt-4 landscape:max-w-3xl";

function Title({ children }) {
  return <div className="shrink-0 text-center text-lg font-black" style={{ color: COLORS.text }}>{children}</div>;
}

export default function RemoteControl({ room, dispatch, onClose }) {
  const screen = room.screen;
  const back = () => dispatch({ type: "BACK_TO_HUB" });
  const header = (
    <div className="flex shrink-0 items-center justify-between">
      <div className="text-xs font-bold" style={{ color: COLORS.amber }}>🎛 שלט מנחה</div>
      <div className="text-xs" style={{ color: COLORS.muted }}>{room.players.length} שחקנים</div>
    </div>
  );

  if (screen === "lobby") {
    const can = room.players.length >= 3;
    return (
      <div className={wrap}>
        {header}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Sparkles size={40} color={COLORS.purple} />
          <Title>מתחילים את הערב</Title>
          <p className="text-sm" style={{ color: COLORS.muted }}>{can ? "כולם הצטרפו? אפשר להתחיל." : "נדרשים 3 שחקנים לפחות."}</p>
          <Btn full variant="primary" disabled={!can} onClick={() => dispatch({ type: "START_HUB" })}><Sparkles size={18} /> התחילו את הערב</Btn>
        </div>
      </div>
    );
  }

  if (screen === "hub") {
    const anyScore = room.players.some((p) => p.score > 0 || p.correct > 0 || p.skips > 0 || p.diagnosed > 0);
    return (
      <div className={wrap}>
        {header}
        <Title>בחרו משחק</Title>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3">
          {GAME_DEFS.filter((g) => room.enabledGames.includes(g.id)).map((g) => (
            <button key={g.id} onClick={() => dispatch({ type: "START_GAME", game: g.id })} className="rounded-2xl border p-4 text-right" style={{ borderColor: g.color, background: `${g.color}1a` }}>
              <div className="font-black" style={{ color: COLORS.text }}>{g.title}</div>
              <div className="text-xs" style={{ color: COLORS.muted }}>{g.desc}</div>
            </button>
          ))}
        </div>
        <Btn full variant="gold" disabled={!anyScore} onClick={() => dispatch({ type: "GO_PODIUM" })}><Trophy size={18} /> לוח התוצאות</Btn>
      </div>
    );
  }

  if (screen === "whoami" || screen === "alias") {
    const g = room[screen];
    const turnPlayer = room.players[g.turnIdx];
    const nextPlayer = room.players[(g.turnIdx + 1) % room.players.length];
    const title = screen === "whoami" ? "מי אני?" : "אליאס סלון";
    return (
      <div className={wrap}>
        {header}
        <Title>{title}: התור של {turnPlayer.name}</Title>
        {g.phase === "ready" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Btn full variant="primary" onClick={() => dispatch({ type: "START_TURN", game: screen })}>התחילו תור</Btn>
          </div>
        )}
        {g.phase === "playing" && (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
            <div className="text-4xl font-black" style={{ color: COLORS.amber }}>⏱ {g.timeLeft}</div>
            <div className="flex gap-6 text-sm font-bold">
              <span style={{ color: COLORS.emerald }}>נכונות: {g.correct}</span>
              <span style={{ color: COLORS.coral }}>דילוגים: {g.skips}</span>
            </div>
            {room.paused ? (
              <Btn full variant="gold" onClick={() => dispatch({ type: "SET_PAUSED", value: false })}><Play size={18} /> המשך</Btn>
            ) : (
              <>
                {screen === "whoami" ? (
                  <div className="grid w-full flex-1 grid-cols-2 gap-3">
                    <Btn variant="danger" className="!text-lg" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "skip", cursor: g.cursor })}><SkipForward size={20} /> דלג</Btn>
                    <Btn variant="primary" className="!text-lg" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "correct", cursor: g.cursor })}><ThumbsUp size={20} /> הצליח/ה!</Btn>
                  </div>
                ) : (
                  <p className="text-center text-xs" style={{ color: COLORS.muted }}>באליאס המסביר לוחץ "נכון" ו"דלג" בטלפון שלו.</p>
                )}
                <Btn full variant="subtle" onClick={() => dispatch({ type: "SET_PAUSED", value: true })}><Pause size={18} /> PAUSE</Btn>
              </>
            )}
          </div>
        )}
        {g.phase === "turnEnd" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Trophy size={36} color={COLORS.amber} />
            <div className="font-black" style={{ color: COLORS.text }}>{turnPlayer.name} סיים/ה עם {g.correct} נקודות</div>
            <Btn full variant="primary" onClick={() => dispatch({ type: "NEXT_TURN", game: screen })}><ArrowLeft size={18} /> תור הבא: {nextPlayer.name}</Btn>
          </div>
        )}
        <Btn full variant="ghost" className="shrink-0" onClick={back}><Home size={18} /> מרכז המשחקים</Btn>
      </div>
    );
  }

  if (screen === "shrink") {
    const s = room.shrink;
    return (
      <div className={wrap}>
        {header}
        <Title>הפסיכולוג</Title>
        {s.phase === "select" && (
          <>
            <p className="shrink-0 text-center text-sm" style={{ color: COLORS.muted }}>מי מאבחן/ת?</p>
            <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto">
              {room.players.map((p, i) => (
                <button key={p.id} onClick={() => dispatch({ type: "SHRINK_SELECT", id: p.id })} className="flex items-center gap-3 rounded-2xl border p-3 text-right" style={{ borderColor: s.psychId === p.id ? COLORS.emerald : COLORS.border, background: s.psychId === p.id ? `${COLORS.emerald}1a` : COLORS.surface }}>
                  <Avatar index={i} name={p.name} />
                  <span className="flex-1 font-bold" style={{ color: COLORS.text }}>{p.name}</span>
                </button>
              ))}
            </div>
            <Btn full variant="primary" disabled={!s.psychId} onClick={() => dispatch({ type: "SHRINK_ASSIGN" })}><Stethoscope size={18} /> הקצו כלל סודי והתחילו</Btn>
          </>
        )}
        {s.phase === "diagnose" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm" style={{ color: COLORS.muted }}>הפסיכולוג מנסה לגלות את הכלל. רמזים: {s.clues}</p>
            <Btn full variant="primary" onClick={() => dispatch({ type: "SHRINK_FINISH" })}><Trophy size={18} /> סיום הסיבוב</Btn>
          </div>
        )}
        {s.phase === "result" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Trophy size={36} color={COLORS.amber} />
            <div className="font-black" style={{ color: COLORS.text }}>הסיבוב נגמר: {s.totalScore} נקודות</div>
            <p className="text-sm" style={{ color: COLORS.muted }}>הכלל היה: {s.rule}</p>
          </div>
        )}
        <Btn full variant="ghost" className="shrink-0" onClick={back}><Home size={18} /> מרכז המשחקים</Btn>
      </div>
    );
  }

  if (screen === "podium") {
    return (
      <div className={wrap}>
        {header}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Trophy size={40} color={COLORS.amber} />
          <Title>לוח התוצאות</Title>
          <Btn full variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}><RefreshCw size={18} /> סיבוב נוסף</Btn>
        </div>
      </div>
    );
  }
  return null;
}
