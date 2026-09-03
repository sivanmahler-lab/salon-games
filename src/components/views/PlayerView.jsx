import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer, Trophy, ThumbsUp, SkipForward, Target, Stethoscope, Lightbulb, Award, Sparkles, Wifi, WifiOff } from "lucide-react";
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
          <span style={{ color: COLORS.emerald }}>✓ {w.correct}</span>
          <span style={{ color: COLORS.coral }}>⏭ {w.skips}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center text-lg font-black" style={{ color: COLORS.amber }}>⏱ {w.timeLeft}</div>
      <PartyCard big stampColor={COLORS.purple} stampLabel="מי אני?">{w.deck[w.cursor]}</PartyCard>
      <div className="grid w-full grid-cols-2 gap-3">
        <Btn variant="danger" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "skip", cursor: w.cursor })}><SkipForward size={18} /> דלג</Btn>
        <Btn variant="primary" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "correct", cursor: w.cursor })}><ThumbsUp size={18} /> הצליח/ה!</Btn>
      </div>
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
        <p className="text-xs" style={{ color: COLORS.muted }}>אפשר גם להחליק ימינה או שמאלה</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="text-3xl font-black" style={{ color: COLORS.amber }}>⏱ {a.timeLeft}</div>
      <div className="text-lg font-black" style={{ color: COLORS.text }}>{turnPlayer.name} מסביר/ה — נחשו בקול!</div>
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
      const others = room.players.filter((p) => p.id !== myId);
      return (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
          <div className="mb-4 text-center text-lg font-black" style={{ color: COLORS.text }}>לוח האבחון שלך</div>
          <p className="mb-4 text-center text-xs" style={{ color: COLORS.muted }}>לכל שחקן/ית אפשר לבקש רמז (מוריד נקודה) ואז לנסות לאבחן.</p>
          <div className="space-y-3">
            {others.map((p, i) => (
              <GlassCard key={p.id} className={s.diagnosed[p.id] ? "opacity-60" : ""}>
                <div className="mb-2 flex items-center gap-3">
                  <Avatar index={i} name={p.name} />
                  <span className="flex-1 font-black" style={{ color: COLORS.text }}>{p.name}</span>
                  <span className="text-xs" style={{ color: COLORS.muted }}>רמזים: {s.clues[p.id]}</span>
                </div>
                <div className="flex gap-2">
                  <Btn variant="subtle" className="flex-1" disabled={s.diagnosed[p.id]} onClick={() => dispatch({ type: "SHRINK_CLUE", id: p.id })}><Lightbulb size={16} /> רמז</Btn>
                  <Btn variant="primary" className="flex-1" disabled={s.diagnosed[p.id]} onClick={() => dispatch({ type: "SHRINK_DIAGNOSE", id: p.id })}><Award size={16} /> {s.diagnosed[p.id] ? "אובחן/ה" : "לחשוף אבחנה"}</Btn>
                </div>
              </GlassCard>
            ))}
          </div>
          <div className="mt-6">
            <Btn full variant="primary" onClick={() => dispatch({ type: "SHRINK_FINISH" })}><Trophy size={18} /> סיום הסיבוב</Btn>
          </div>
        </div>
      );
    }
    if (s.phase === "result") {
      return (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-lg font-black" style={{ color: COLORS.text }}>סיימת עם {s.totalScore} נקודות!</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יעביר את כולם למרכז המשחקים...</p>
        </div>
      );
    }
  }

  // patient
  const myRule = s.rules?.[myId];
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center text-sm font-bold" style={{ color: COLORS.muted }}>הכלל הסודי שלך — אף אחד אחר לא רואה את זה</div>
      <PartyCard stampColor={COLORS.emerald} stampLabel="הכלל הסודי שלך">{myRule || "מחכים שהמנחה יקצה כלל..."}</PartyCard>
      <p className="text-xs" style={{ color: COLORS.muted }}>פעלו לפי הכלל הזה בלי לחשוף אותו — הפסיכולוג/ית ינסה/תנסה לגלות</p>
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
              ודאו שקוד החדר נכון וכי מסך המנחה פתוח — שימו לב: כרגע החיבור עובד רק בין כרטיסיות של אותו דפדפן, לא בין מכשירים נפרדים.
            </p>
            <Btn variant="ghost" onClick={onExit}>חזרה</Btn>
          </>
        )}
      </div>
    );
  }

  if (room.screen === "lobby") return <PlayerWaiting room={room} myName={name} label="ממתינים שהמנחה יתחיל את הערב..." />;
  if (room.screen === "hub") return <PlayerWaiting room={room} myName={name} label="המנחה בוחר/ת משחק..." />;
  if (room.screen === "whoami") return <PlayerWhoAmI room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "shrink") return <PlayerShrink room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "alias") return <PlayerAlias room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "podium") return <Podium players={room.players} actions={<p className="text-center text-xs" style={{ color: COLORS.muted }}>ממתינים שהמנחה יחליט מה הלאה...</p>} />;
  return null;
}
