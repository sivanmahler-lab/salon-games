import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer, Trophy, ThumbsUp, SkipForward, Target, Stethoscope, Lightbulb, Award, Sparkles, Wifi, WifiOff, Pause } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { createRoomChannel, generateId, normalizeRoomCode } from "../../utils/roomSync";
import { Btn, GlassCard, Avatar, Logo, PartyCard, WinBanner } from "../common/UIComponents";
import { Podium } from "./Podium";
import RemoteControl from "./RemoteControl";
import { PlayerImposter, PlayerBoggle } from "./NewGameViews";
import { LEXICON } from "../../data/lexicon";
import { useEndBeep, useBeepWhen } from "../../utils/soloHelpers";
import ScoreButton from "../common/ScoreButton";
import JoinLeaveToasts from "../common/JoinLeaveToasts";
import { shareScores, cheer, buzz } from "../../utils/extras";

/* ============================================================================
   PLAYER — views
============================================================================ */

export function PlayerWaiting({ room, myName, label }) {
  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-5 landscape:gap-2 px-6 text-center">
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
  useEndBeep(w.timeLeft, turnPlayer?.id === myId);

  if (w.phase === "ready") {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-4 landscape:gap-2 px-6 text-center">
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
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-4 landscape:gap-2 px-6 text-center">
        <Trophy size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>הסיבוב הזה הסתיים!</div>
        <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יתחיל את התור הבא...</p>
      </div>
    );
  }

  // playing
  if (isGuesser) {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-6 landscape:gap-2 px-6 text-center">
        <div className="text-2xl font-black" style={{ color: COLORS.amber }}>⏱ {w.timeLeft}</div>
        <WinBanner won={w.won} />
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
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-6 landscape:gap-2 px-6">
      <div className="text-center text-lg font-black" style={{ color: COLORS.amber }}>⏱ {w.timeLeft}</div>
      <WinBanner won={w.won} />
      <PartyCard big stampColor={COLORS.purple} stampLabel="מי אני?">{w.deck[w.cursor]}</PartyCard>
    </div>
  );
}

export function PlayerAlias({ room, dispatch, myId }) {
  const a = room.alias;
  const turnPlayer = room.players[a.turnIdx];
  const isDescriber = turnPlayer?.id === myId;
  useEndBeep(a.timeLeft, isDescriber);
  const [dragX, setDragX] = useState(0);
  const solo = a.mode !== "teams";

  if (a.phase === "ready") {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-4 landscape:gap-2 px-6 text-center">
        <Timer size={36} color={COLORS.amber} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>
          {isDescriber ? "התור שלך להסביר מתחיל עוד רגע!" : `התור של ${turnPlayer.name} להסביר מתחיל עוד רגע`}
        </div>
        <p className="max-w-xs text-sm leading-relaxed" style={{ color: COLORS.muted }}>
          {isDescriber
            ? "תראו מילה על המסך. הסבירו אותה בעל פה בלי להגיד אותה, כדי שהאחרים ינחשו. ויש 60 שניות. " + (a.mode === "teams" ? "כשחברי הקבוצה ניחשו נכון לחצו \"נכון\" (הנקודה לקבוצה), ואם אין מושג \"דלג\"." : "כשמישהו ניחש נכון לחצו על השם שלו (נקודה לו ונקודה לך), ואם אין מושג \"דלג\".")
            : "אתם מנחשים! המסביר/ה מתאר/ת מילה בלי להגיד אותה. צעקו תשובות בקול, והוא/היא יסמנו כשניחשתם."}
        </p>
      </div>
    );
  }

  if (a.phase === "turnEnd") {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-4 landscape:gap-2 px-6 text-center">
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
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-6 landscape:gap-2 px-6">
        <div className="text-center text-2xl font-black" style={{ color: COLORS.emerald }}>{a.correct}</div>
        <motion.div
          className="w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDrag={(_, info) => setDragX(info.offset.x)}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100 && !solo) advance(true);
            else if (info.offset.x < -100) advance(false);
            else setDragX(0);
          }}
          animate={{ x: 0, rotate: dragX / 20 }}
          style={{ x: dragX }}
        >
          <PartyCard big stampColor={COLORS.amber} stampLabel="אליאס">{a.deck[a.cursor]}</PartyCard>
        </motion.div>
        {solo ? (
          <div className="w-full">
            <p className="mb-2 text-center text-xs font-bold" style={{ color: COLORS.muted }}>מי ניחש נכון? לחצו על השם:</p>
            <div className="grid w-full grid-cols-2 gap-2">
              {room.players.filter((p) => p.id !== myId).map((p) => (
                <Btn key={p.id} variant="primary" className="!py-2 !text-sm" onClick={() => { dispatch({ type: "ALIAS_GUESS", cursor: a.cursor, guesserId: p.id }); setDragX(0); }}>
                  {p.name}{a.guessed?.[p.id] ? ` (${a.guessed[p.id]})` : ""}
                </Btn>
              ))}
            </div>
            <Btn full variant="subtle" className="mt-2" onClick={() => advance(false)}><SkipForward size={18} /> דלג (אף אחד לא ניחש)</Btn>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3">
            <Btn variant="subtle" onClick={() => advance(false)}><SkipForward size={18} /> דלג</Btn>
            <Btn variant="primary" onClick={() => advance(true)}><Target size={18} /> נכון! (+1)</Btn>
          </div>
        )}
        <p className="text-center text-xs leading-relaxed" style={{ color: COLORS.muted }}>{solo ? "הסבירו את המילה בקול בלי להגיד אותה, ואז סמנו מי ניחש." : "הסבירו את המילה בקול בלי להגיד אותה. ניחשו נכון: \"נכון\". לא מצליחים: \"דלג\". אפשר גם להחליק ימינה (נכון) או שמאלה (דלג)."}</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-5 landscape:gap-2 px-6 text-center">
      <div className="text-3xl font-black" style={{ color: COLORS.amber }}>⏱ {a.timeLeft}</div>
      <div className="text-lg font-black" style={{ color: COLORS.text }}>{turnPlayer.name} מסביר/ה מילה. נחשו בקול מה המילה!</div>
      <div className="flex gap-6 text-sm font-bold">
        <span style={{ color: COLORS.emerald }}>✓ {a.correct} נכונות בתור הזה</span>
      </div>
    </div>
  );
}

export function PlayerLexicon({ room, dispatch, myId }) {
  const L = room.lexicon;
  const entry = LEXICON[L.wordIdx] || { w: "", d: "" };
  const [text, setText] = useState("");
  const mine = L.defs?.[myId];
  const myVote = L.votes?.[myId];
  const gain = L.gains?.[myId] || 0;
  const roundKey = `${L.cursor}`;
  useEffect(() => { setText(""); }, [roundKey]);

  const head = (
    <div className="shrink-0 text-center">
      <div className="text-xs font-bold" style={{ color: COLORS.sky }}>המילה הלועזית</div>
      <div className="font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif", fontSize: "clamp(1.8rem, min(10vw, 9vh), 3rem)" }}>{entry.w}</div>
    </div>
  );
  const wrapCls = "relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col gap-3 overflow-hidden px-5 py-4 landscape:max-w-3xl";

  if (L.phase === "level") {
    return (
      <div className={wrapCls}>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-lg font-black" style={{ color: COLORS.text }}>המנחה בוחר/ת רמת קושי...</p>
        </div>
      </div>
    );
  }

  if (L.phase === "check") {
    const answered = !!L.seen?.[myId];
    return (
      <div className={wrapCls}>
        {head}
        {L.notice && (
          <div className="shrink-0 rounded-xl border px-3 py-2 text-center text-sm font-bold" style={{ borderColor: COLORS.amber, color: COLORS.amber }}>
            {L.notice.swapped ? `המילה הקודמת (${L.notice.word}) הוחלפה על ידי ${L.notice.by}` : `המילה הקודמת (${L.notice.word}) הייתה מוכרת ל${L.notice.by}, ולכן הוחלפה`}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-black" style={{ color: COLORS.text }}>האם את/ה מכיר/ה את המילה?</p>
          {answered ? (
            <p className="text-sm font-bold" style={{ color: COLORS.emerald }}>ענית "לא מכיר" ✓ מחכים לשאר השחקנים</p>
          ) : (
            <p className="text-sm" style={{ color: COLORS.muted }}>אם מישהו מכיר, המילה מוחלפת</p>
          )}
        </div>
        <Btn full variant="primary" disabled={answered} onClick={() => dispatch({ type: "LEX_KNOW", id: myId, known: false })}>לא מכיר/ה</Btn>
        <Btn full variant="ghost" onClick={() => dispatch({ type: "LEX_KNOW", id: myId, known: true })}>מכיר/ה את המילה</Btn>
        <Btn full variant="ghost" onClick={() => dispatch({ type: "LEX_SKIP", id: myId })}>🔄 החלפת מילה</Btn>
      </div>
    );
  }

  if (L.phase === "write") {
    return (
      <div className={wrapCls}>
        {head}
        <p className="shrink-0 text-center text-sm" style={{ color: COLORS.muted }}>המציאו הגדרה בעברית שנשמעת אמיתית. האחרים ינסו לנחש מה האמיתי.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder="הכתבו כאן את ההגדרה"
          aria-label="ההגדרה שלך"
          className="min-h-0 flex-1 resize-none rounded-2xl border-2 bg-transparent p-3 text-lg font-bold outline-none focus:border-[#a855f7]"
          style={{ borderColor: mine ? COLORS.emerald : COLORS.purple, color: COLORS.text }}
        />
        <Btn full variant="primary" disabled={!text.trim()} onClick={() => dispatch({ type: "LEX_SUBMIT", id: myId, text })}>{mine ? "עדכון ההגדרה" : "שליחה"}</Btn>
        {mine && <p className="shrink-0 text-center text-xs" style={{ color: COLORS.emerald }}>ההגדרה נשלחה ✓ אפשר לעדכן עד שכולם מסיימים</p>}
        <Btn full variant="ghost" onClick={() => dispatch({ type: "LEX_SKIP", id: myId })}>🔄 החלפת מילה</Btn>
      </div>
    );
  }

  if (L.phase === "vote") {
    return (
      <div className={wrapCls}>
        {head}
        <p className="shrink-0 text-center text-sm" style={{ color: COLORS.muted }}>איזו הגדרה נראית לכם אמיתית? הקישו עליה</p>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {L.options.map((o, i) => {
            const own = o.owner === myId;
            const chosen = myVote === o.id;
            return (
              <button
                key={o.id}
                disabled={own}
                aria-label={`הגדרה ${i + 1}${own ? " (שלך)" : ""}`}
                onClick={() => dispatch({ type: "LEX_VOTE", id: myId, option: o.id })}
                className="flex items-center gap-3 rounded-2xl border-2 p-3 text-right disabled:opacity-40"
                style={{ borderColor: chosen ? COLORS.sky : COLORS.border, background: chosen ? `${COLORS.sky}33` : COLORS.surface, color: COLORS.text }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black" style={{ background: `${COLORS.sky}33`, color: COLORS.sky }}>{i + 1}</span>
                <span className="flex-1 text-base font-bold">{o.text}{own && <span className="mr-2 text-xs" style={{ color: COLORS.muted }}> (שלך)</span>}</span>
              </button>
            );
          })}
        </div>
        <p className="shrink-0 text-center text-xs" style={{ color: myVote ? COLORS.emerald : COLORS.muted }}>{myVote ? "ההצבעה נקלטה ✓ אפשר לשנות" : "עוד לא הצבעת"}</p>
        <Btn full variant="ghost" onClick={() => dispatch({ type: "LEX_SKIP", id: myId })}>🔄 החלפת מילה</Btn>
      </div>
    );
  }

  return (
    <div className={wrapCls}>
      {head}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="text-xs font-bold" style={{ color: COLORS.emerald }}>ההגדרה האמיתית</div>
        <div className="rounded-2xl border-2 p-4 text-base font-black" style={{ borderColor: COLORS.emerald, background: `${COLORS.emerald}1a`, color: COLORS.text }}>{entry.d}</div>
        <div className="text-lg font-black" style={{ color: gain ? COLORS.amber : COLORS.muted }}>{gain ? `קיבלת ${gain} ${gain === 1 ? "נקודה" : "נקודות"}` : "הפעם בלי נקודות"}</div>
      </div>
      <Btn full variant="primary" onClick={() => dispatch({ type: "LEX_NEXT" })}>מילה הבאה</Btn>
    </div>
  );
}

export function PlayerShrink({ room, dispatch, myId }) {
  const s = room.shrink;
  const isPsych = s.psychId === myId;
  useBeepWhen(isPsych && !!s.found);

  if (s.phase === "select") {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-4 landscape:gap-2 px-6 text-center">
        <Stethoscope size={36} color={COLORS.emerald} />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>המנחה בוחר/ת מי מאבחן/ת...</div>
      </div>
    );
  }

  if (isPsych) {
    if (s.phase === "diagnose") {
      return (
        <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-6 landscape:gap-2 px-6 text-center">
          <Stethoscope size={40} color={COLORS.emerald} />
          <div className="text-xl font-black leading-relaxed" style={{ color: COLORS.text }}>
            התור שלך! עליך לגלות את הכלל
          </div>
          <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>
            שאלו שאלות את מי שתרצו משאר השחקנים. כולם מתנהגים לפי אותו כלל סודי, ואתם צריכים לנחש מה הוא.
          </p>
          {s.found && s.rule && (
            <div className="w-full rounded-2xl border-2 px-4 py-3" style={{ borderColor: COLORS.emerald, background: `${COLORS.emerald}22` }}>
              <div className="text-xs font-bold" style={{ color: COLORS.emerald }}>🎉 הכלל היה</div>
              <div className="text-lg font-black" style={{ color: COLORS.text }}>{s.rule}</div>
            </div>
          )}
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
        <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-4 landscape:gap-2 px-6 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-lg font-black" style={{ color: COLORS.text }}>סיימת עם {s.totalScore} נקודות!</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>הכלל היה: {s.rule}</p>
          <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יתחיל סבב נוסף או יחזור למרכז המשחקים...</p>
        </div>
      );
    }
  }

  // everyone else follows the same rule
  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-6 landscape:gap-2 px-6">
      <div className="text-center text-sm font-bold" style={{ color: COLORS.muted }}>הכלל הסודי של כולם. אל תגלו אותו, תנו לפסיכולוג/ית לנחש</div>
      <PartyCard stampColor={COLORS.emerald} stampLabel="הכלל הסודי">{s.rule || "מחכים שהמנחה יתחיל..."}</PartyCard>
      <p className="text-xs" style={{ color: COLORS.muted }}>כשהפסיכולוג/ית שואל/ת אתכם שאלה, ענו לפי הכלל הזה בלי לחשוף אותו</p>
    </div>
  );
}

export default function PlayerApp({ roomCode, name, traits, onExit, onTakeover }) {
  const [myId] = useState(() => generateId());
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [remote, setRemote] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && navigator.onLine === false);
  const [silentFor, setSilentFor] = useState(0); // seconds since the host last said anything
  const channelRef = useRef(null);
  const roomRef = useRef(null);
  roomRef.current = room;

  useEffect(() => {
    let alive = true;
    let unsub = () => {};
    let lastSeen = Date.now();
    let lastState = Date.now();

    // (Re)connect to the room and ask the host for the current state.
    const connect = () => {
      unsub();
      channelRef.current?.close();
      const ch = createRoomChannel(normalizeRoomCode(roomCode));
      channelRef.current = ch;
      unsub = ch.subscribe((msg) => {
        if (msg.type === "STATE") {
          lastSeen = Date.now();
          lastState = Date.now();
          setRoom(msg.room);
          setConnecting(false);
        }
      });
      ch.send({ type: "ACTION", action: { type: "JOIN", id: myId, name, traits } });
      ch.send({ type: "ACTION", action: { type: "SYNC" } });
    };
    connect();

    // A phone that went to the background (another tab, locked screen) may have missed updates or lost its
    // connection. When it comes back, or when the host has been silent too long, reconnect and catch up.
    const wake = () => { if (alive && !document.hidden) connect(); };
    const goOff = () => setOffline(true);
    const goOn = () => setOffline(false);
    window.addEventListener("offline", goOff);
    window.addEventListener("online", goOn);
    const silence = setInterval(() => setSilentFor(Math.round((Date.now() - lastState) / 1000)), 2000);
    const watchdog = setInterval(() => { if (alive && !document.hidden && Date.now() - lastSeen > 12000) { lastSeen = Date.now(); connect(); } }, 4000);
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("pageshow", wake);
    window.addEventListener("online", wake);

    const timeout = setTimeout(() => setConnecting(false), 6000);
    return () => {
      alive = false;
      unsub();
      channelRef.current?.close();
      clearInterval(watchdog);
      clearInterval(silence);
      window.removeEventListener("offline", goOff);
      window.removeEventListener("online", goOn);
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("online", wake);
    };
  }, [roomCode]);

  const dispatch = useCallback((action) => channelRef.current?.send({ type: "ACTION", action }), []);
  const leave = () => { channelRef.current?.send({ type: "ACTION", action: { type: "LEAVE", id: myId } }); setTimeout(onExit, 150); };

  if (!room) {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md landscape:max-w-3xl flex-col items-center justify-center overflow-hidden py-3 gap-4 landscape:gap-2 px-6 text-center">
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

  if (room.left?.includes(myId)) {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo />
        <div className="text-lg font-black" style={{ color: COLORS.text }}>יצאת מהמשחק</div>
        <p className="text-sm" style={{ color: COLORS.muted }}>המנחה הוציא/ה אותך מהחדר. אפשר להצטרף מחדש בסריקת ה-QR.</p>
        <Btn variant="ghost" onClick={onExit}>חזרה</Btn>
      </div>
    );
  }

  const inGame = ["hub", "whoami", "alias", "lexicon", "shrink", "imposter", "boggle"].includes(room.screen);
  const hostGone = !offline && silentFor >= 25;
  return (
    <>
      <JoinLeaveToasts players={room.players} />
      {(offline || silentFor >= 12) && (
        <div role="alert" className="fixed inset-x-0 top-0 z-[88] flex flex-col items-center gap-1 px-3 py-2 text-center text-xs font-bold" style={{ background: COLORS.coral, color: "#fff" }}>
          <div className="flex items-center gap-1.5"><WifiOff size={14} /> {offline ? "אין חיבור לאינטרנט בטלפון הזה. מנסים להתחבר מחדש..." : "המנחה לא עונה כרגע. מנסים להתחבר מחדש..."}</div>
          {hostGone && onTakeover && (
            <button
              onClick={() => { if (window.confirm("המנחה נעלם. לקחת את הניהול על הטלפון הזה? הערב ימשיך מהמקום שבו נעצר.")) onTakeover({ roomCode, room: roomRef.current }); }}
              className="rounded-full px-3 py-1 text-[11px] font-black" style={{ background: "#fff", color: COLORS.coral }}
            >
              לקחת את הניהול על הטלפון שלי
            </button>
          )}
        </div>
      )}
      {inGame && <ScoreButton rows={room.players.map((p) => ({ name: p.name, score: p.score || 0 }))} />}
      {remote ? (
        <RemoteControl room={room} dispatch={dispatch} roomCode={roomCode} />
      ) : (
        <>
          <PlayerScreen room={room} dispatch={dispatch} myId={myId} name={name} />
          {room.paused && <PausedOverlay />}
        </>
      )}
      {/* Turns this phone into the host's remote (and back), so the host does not have to use the TV itself. */}
      <button
        onClick={() => setRemote(!remote)}
        className="fixed bottom-3 left-3 z-[70] rounded-full border px-3 py-1.5 text-[11px] font-bold"
        style={{ borderColor: remote ? COLORS.amber : COLORS.border, background: remote ? COLORS.amber : COLORS.surface, color: remote ? "#0b0f1a" : COLORS.muted }}
      >
        {remote ? "חזרה למסך שלי" : "🎛 שלט מנחה"}
      </button>
      <button
        onClick={() => { if (window.confirm("לצאת מהמשחק?")) leave(); }}
        className="fixed left-2 top-2 z-[70] rounded-full border px-2.5 py-1 text-[10px] font-bold"
        style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.coral }}
      >
        יציאה מהמשחק
      </button>
    </>
  );
}

// Covers the whole screen on every phone while the host has pressed PAUSE.
export function PausedOverlay() {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: COLORS.bg }}
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
  if (room.screen === "lexicon") return <PlayerLexicon room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "imposter") return <PlayerImposter room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "boggle") return <PlayerBoggle room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "shrink") return <PlayerShrink room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "alias") return <PlayerAlias room={room} dispatch={dispatch} myId={myId} />;
  if (room.screen === "podium") return <Podium players={room.players} actions={<div className="space-y-3"><Btn full variant="gold" onClick={() => shareScores(room.players)}>📤 שיתוף תמונה של הניקוד</Btn><p className="text-center text-xs" style={{ color: COLORS.muted }}>ממתינים שהמנחה יחליט מה הלאה...</p></div>} />;
  return null;
}
