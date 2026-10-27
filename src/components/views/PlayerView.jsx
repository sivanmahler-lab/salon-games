import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer, Trophy, ThumbsUp, SkipForward, Target, Stethoscope, Lightbulb, Award, Sparkles, Wifi, WifiOff, Pause } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { createRoomChannel, generateId, normalizeRoomCode } from "../../utils/roomSync";
import { Btn, GlassCard, Avatar, Logo, PartyCard } from "../common/UIComponents";
import { Podium } from "./Podium";

/* ============================================================================
   PLAYER — views
============================================================================ */

export function PlayerWaiting({ room, myName, label }) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <Sparkles size={36} color={COLORS.purple} />
      <div>
        <div className="text-lg font-black" style={{ color: COLORS.text }}>מחוברים בתור {myName}!</div>
        <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>{label}</p>
      </div>
      <div className="text-xs" style={{ color: COLORS.muted }}>{room.players.length} שחקנים בחדר כרגע</div>
    </div>
  );
}

export function PlayerWhoAmI({ room, dispatch, myId }) {
  const w = room.whoami;
  const turnPlayer = room.players[w.turnIdx];
  const isGuesser = turnPlayer?.id === myId;

  if (w.phase === "ready") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Timer size={36} color={COLORS.purple} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>
          {isGuesser ? "התור שלך מתחיל עוד רגע!" : `התור של ${turnPlayer.name} מתחיל עוד רגע`}
        </div>
        <p className="text-sm" style={{ color: COLORS.muted }}>{isGuesser ? "אתם לא תראו כלום — כולם סביבכם יתארו." : "התכוננו לתאר בלי להגיד את המילים על הכרטיס."}</p>
      </div>
    );
  }

  if (w.phase === "turnEnd") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Trophy size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>הסיבוב הזה הסתיים!</div>
        <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יתחיל את התור הבא...</p>
      </div>
    );
  }

  // playing
  if (isGuesser) {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-2xl font-black" style={{ color: COLORS.amber }}>⏱ {w.timeLeft}</div>
        <div className="rounded-3xl border-2 border-dashed p-8" style={{ borderColor: COLORS.purple, background: `${COLORS.purple}1a` }}>
          <div className="text-lg font-black leading-relaxed" style={{ color: COLORS.text }}>
            כולם רואים את הדמות שלך חוץ ממך - התחל לנחש!
          </div>
        </div>
        <div className="flex gap-6 text-sm font-bold">
          <span style={{ color: COLORS.emerald }}>נכונות: {w.correct}</span>
          <span style={{ color: COLORS.coral }}>דילוגים: {w.skips}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center text-lg font-black" style={{ color: COLORS.amber }}>⏱ {w.timeLeft}</div>
      <PartyCard big stampColor={COLORS.purple} stampLabel="מי אני?">{w.deck[w.cursor]}</PartyCard>
    </div>
  );
}

export function PlayerAlias({ room, dispatch, myId }) {
  const a = room.alias;
  const turnPlayer = room.players[a.turnIdx];
  const isDescriber = turnPlayer?.id === myId;
  const [dragX, setDragX] = useState(0);

  if (a.phase === "ready") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Timer size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>
          {isDescriber ? "התור שלך להסביר מתחיל עוד רגע!" : `התור של ${turnPlayer.name} להסביר מתחיל עוד רגע`}
        </div>
        <p className="max-w-xs text-sm leading-relaxed" style={{ color: COLORS.muted }}>
          {isDescriber
            ? "תראו מילה על המסך. הסבירו אותה בעל פה בלי להגיד אותה, כדי שהאחרים ינחשו. כשניחשו נכון לחצו \"נכון\", ואם אין מושג לחצו \"דלג\". כל מילה נכונה שווה נקודה, ויש 60 שניות."
            : "אתם מנחשים! המסביר/ה מתאר/ת מילה בלי להגיד אותה. צעקו תשובות בקול, והוא/היא יסמנו כשניחשתם."}
        </p>
      </div>
    );
  }

  if (a.phase === "turnEnd") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Trophy size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>הסיבוב הזה הסתיים!</div>
        <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יתחיל את התור הבא...</p>
      </div>
    );
  }

  if (isDescriber) {
    const advance = (isCorrect) => {
      dispatch({ type: "RESULT", game: "alias", result: isCorrect ? "correct" : "skip", cursor: a.cursor });
      setDragX(0);
    };
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
        <div className="text-center text-2xl font-black" style={{ color: COLORS.emerald }}>{a.correct}</div>
        <motion.div
          className="w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDrag={(_, info) => setDragX(info.offset.x)}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) advance(true);
            else if (info.offset.x < -100) advance(false);
            else setDragX(0);
          }}
          animate={{ x: 0, rotate: dragX / 20 }}
          style={{ x: dragX }}
        >
          <PartyCard big stampColor={COLORS.amber} stampLabel="אליאס">{a.deck[a.cursor]}</PartyCard>
        </motion.div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Btn variant="subtle" onClick={() => advance(false)}><SkipForward size={18} /> דלג</Btn>
          <Btn variant="primary" onClick={() => advance(true)}><Target size={18} /> נכון! (+1)</Btn>
        </div>
        <p className="text-center text-xs leading-relaxed" style={{ color: COLORS.muted }}>הסבירו את המילה בקול בלי להגיד אותה. ניחשו נכון: "נכון". לא מצליחים: "דלג". אפשר גם להחליק ימינה (נכון) או שמאלה (דלג).</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="text-3xl font-black" style={{ color: COLORS.amber }}>⏱ {a.timeLeft}</div>
      <div className="text-lg font-black" style={{ color: COLORS.text }}>{turnPlayer.name} מסביר/ה מילה. נחשו בקול מה המילה!</div>
      <div className="flex gap-6 text-sm font-bold">
        <span style={{ color: COLORS.emerald }}>✓ {a.correct} נכונות בתור הזה</span>
      </div>
    </div>
  );
}

export function PlayerShrink({ room, dispatch, myId }) {
  const s = room.shrink;
  const isPsych = s.psychId === myId;

  if (s.phase === "select") {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Stethoscope size={36} color={COLORS.emerald} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>המנחה בוחר/ת מי מאבחן/ת...</div>
      </div>
    );
  }

  if (isPsych) {
    if (s.phase === "diagnose") {
      return (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
          <Stethoscope size={40} color={COLORS.emerald} />
          <div className="text-xl font-black leading-relaxed" style={{ color: COLORS.text }}>
            התור שלך! עליך לגלות את הכלל
          </div>
          <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>
            שאלו שאלות את מי שתרצו משאר השחקנים. כולם מתנהגים לפי אותו כלל סודי, ואתם צריכים לנחש מה הוא.
          </p>
          <div className="text-xs" style={{ color: COLORS.muted }}>רמזים שנוצלו: {s.clues}</div>
          <div className="grid w-full grid-cols-2 gap-3">
            <Btn variant="subtle" disabled={s.found} onClick={() => dispatch({ type: "SHRINK_CLUE" })}><Lightbulb size={16} /> רמז</Btn>
            <Btn variant="primary" disabled={s.found} onClick={() => dispatch({ type: "SHRINK_DIAGNOSE" })}><Award size={16} /> {s.found ? "גיליתי!" : "גיליתי את הכלל"}</Btn>
          </div>
          <Btn full variant="primary" onClick={() => dispatch({ type: "SHRINK_FINISH" })}><Trophy size={18} /> סיום הסיבוב</Btn>
        </div>
      );
    }
    if (s.phase === "result") {
      return (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-lg font-black" style={{ color: COLORS.text }}>סיימת עם {s.totalScore} נקודות!</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>הכלל היה: {s.rule}</p>
          <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יעביר את כולם למרכז המשחקים...</p>
        </div>
      );
    }
  }

  // everyone else follows the same rule
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center text-sm font-bold" style={{ color: COLORS.muted }}>הכלל הסודי של כולם. אל תגלו אותו, תנו לפסיכולוג/ית לנחש</div>
      <PartyCard stampColor={COLORS.emerald} stampLabel="הכלל הסודי">{s.rule || "מחכים שהמנחה יתחיל..."}</PartyCard>
      <p className="text-xs" style={{ color: COLORS.muted }}>כשהפסיכולוג/ית שואל/ת אתכם שאלה, ענו לפי הכלל הזה בלי לחשוף אותו</p>
    </div>
  );
}

export default function PlayerApp({ roomCode, name, traits, onExit }) {
  const [myId] = useState(() => generateId());
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    const ch = createRoomChannel(normalizeRoomCode(roomCode));
    channelRef.current = ch;
    const unsub = ch.subscribe((msg) => {
      if (msg.type === "STATE") {
        setRoom(msg.room);
        setConnecting(false);
      }
    });
    ch.send({ type: "ACTION", action: { type: "JOIN", id: myId, name, traits } });
    const timeout = setTimeout(() => setConnecting(false), 6000);
    return () => { unsub(); ch.close(); clearTimeout(timeout); };
  }, [roomCode]);

  const dispatch = useCallback((action) => channelRef.current?.send({ type: "ACTION", action }), []);

  if (!room) {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo />
        {connecting ? (
          <>
            <Wifi size={32} color={COLORS.purple} />
            <div className="text-sm font-bold" style={{ color: COLORS.text }}>מתחברים לחדר {roomCode}...</div>
          </>
        ) : (
          <>
            <WifiOff size={32} color={COLORS.coral} />
            <div className="text-sm font-bold" style={{ color: COLORS.text }}>לא הצלחנו להתחבר</div>
            <p className="text-xs" style={{ color: COLORS.muted }}>
              ודאו שקוד החדר נכון, שמסך המנחה פתוח ושהאינטרנט עובד, ונסו שוב.
            </p>
            <Btn variant="ghost" onClick={onExit}>חזרה</Btn>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <PlayerScreen room={room} dispatch={dispatch} myId={myId} name={name} />
      {room.paused && <PausedOverlay />}
    </>
  );
}

// Covers the whole screen on every phone while the host has pressed PAUSE.
export function PausedOverlay() {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "rgba(9,13,22,0.97)" }}
    >
      <Pause size={56} color={COLORS.amber} />
      <div className="text-2xl font-black" style={{ color: COLORS.amber }}>המנחה לחץ PAUSE</div>
      <p className="text-sm" style={{ color: COLORS.muted }}>המשחק מושהה והשעון עומד. ממתינים שהמנחה ימשיך.</p>
    </div>
  );
}

function PlayerScreen({ room, dispatch, myId, name }) {
  if (room.screen === "lobby") return <PlayerWaiting room={room} myName={name} label="ממתינים שהמנחה יתחיל את הערב..." />;
  if (room.screen === "hub") return <PlayerWaiting room={room} myName={name} label="המנחה בוחר/ת משחק..." />;
  if (room.screen === "whoami") return <PlayerWhoAmI room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "shrink") return <PlayerShrink room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "alias") return <PlayerAlias room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "podium") return <Podium players={room.players} actions={<p className="text-center text-xs" style={{ color: COLORS.muted }}>ממתינים שהמנחה יחליט מה הלאה...</p>} />;
  return null;
}
