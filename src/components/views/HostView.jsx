import React, { useState, useEffect, useRef, useReducer } from "react";
import {
  Users, Flame, Sparkles, Timer, Trophy, RefreshCw, Home, ArrowLeft, LogOut,
  ChevronLeft, Check, Copy, Stethoscope, DoorOpen, Eye,
} from "lucide-react";
import { COLORS, CATEGORIES, SPICE_LEVELS, GAME_DEFS } from "../../constants/theme";
import { createRoomChannel, generateRoomCode, normalizeRoomCode, roomReducer, createInitialRoom } from "../../utils/roomSync";
import { Btn, GlassCard, Avatar, Logo, QRCode, TopBar } from "../common/UIComponents";
import { Podium } from "./Podium";

/* ============================================================================
   HOST — views
============================================================================ */

export function HostLobby({ room, dispatch, roomCode, onExit }) {
  const setConfig = (patch) => dispatch({ type: "SET_CONFIG", patch });
  const toggleGame = (id) =>
    setConfig({ enabledGames: room.enabledGames.includes(id) ? room.enabledGames.filter((g) => g !== id) : [...room.enabledGames, id] });

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(roomCode)}` : roomCode;
  const [copied, setCopied] = useState(false);
  const canStart = room.players.length >= 3 && room.enabledGames.length >= 1;

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-8 md:max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
          <LogOut size={14} /> סגירת חדר
        </button>
        <Logo />
        <div className="w-[92px]" />
      </div>

      <GlassCard className="mb-6 flex flex-col items-center gap-3 text-center">
        <QRCode text={joinUrl} />
        <div className="flex items-center gap-2">
          <div className="rounded-xl border px-4 py-2 text-lg font-black tracking-widest" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>
            {roomCode}
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(roomCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="rounded-xl p-2.5"
            style={{ background: COLORS.surfaceAlt, color: COLORS.muted }}
          >
            {copied ? <Check size={18} color={COLORS.emerald} /> : <Copy size={18} />}
          </button>
        </div>
        <p className="text-xs" style={{ color: COLORS.muted }}>סרקו את הקוד או הזינו אותו ידנית בטלפון כדי להצטרף</p>
      </GlassCard>

      <div className="space-y-6">
        <section>
          <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>קטגוריית הערב</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = room.category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setConfig({ category: c.id })}
                  className="flex flex-col items-center gap-2 rounded-2xl border p-3.5 transition-all active:scale-95"
                  style={{ borderColor: active ? COLORS.purple : COLORS.border, background: active ? `${COLORS.purple}1a` : COLORS.surface }}
                >
                  <Icon size={22} color={active ? COLORS.purple : COLORS.muted} />
                  <span className="text-xs font-bold" style={{ color: active ? COLORS.text : COLORS.muted }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>רמת חריפות</div>
          <div className="space-y-2.5">
            {SPICE_LEVELS.map((s) => {
              const active = room.spice === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setConfig({ spice: s.id })}
                  className="flex w-full items-center justify-between rounded-2xl border p-3.5 text-right transition-all active:scale-95"
                  style={{ borderColor: active ? s.color : COLORS.border, background: active ? `${s.color}1a` : COLORS.surface }}
                >
                  <div>
                    <div className="font-bold" style={{ color: active ? s.color : COLORS.text }}>{s.label}</div>
                    <div className="text-xs" style={{ color: COLORS.muted }}>{s.desc}</div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Flame key={i} size={15} color={i < s.id ? s.color : COLORS.border} fill={i < s.id ? s.color : "none"} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>אילו משחקים בתוכנית?</div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {GAME_DEFS.map((g) => {
              const Icon = g.icon;
              const active = room.enabledGames.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGame(g.id)}
                  className="flex items-center gap-3 rounded-2xl border p-3.5 text-right transition-all active:scale-95"
                  style={{ borderColor: active ? g.color : COLORS.border, background: active ? `${g.color}1a` : COLORS.surface }}
                >
                  <Icon size={20} color={active ? g.color : COLORS.muted} />
                  <span className="text-sm font-bold" style={{ color: active ? COLORS.text : COLORS.muted }}>{g.title}</span>
                  {active && <Check size={16} color={g.color} className="mr-auto" />}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: COLORS.muted }}>
            <Users size={16} /> מי הצטרף עד עכשיו ({room.players.length})
          </div>
          {room.players.length === 0 ? (
            <p className="text-xs" style={{ color: COLORS.muted }}>ממתינים שיצטרפו שחקנים מהטלפונים שלהם...</p>
          ) : (
            <div className="space-y-2">
              {room.players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
                  <Avatar index={i} name={p.name} />
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: COLORS.text }}>{p.name}</div>
                    {p.traits.length > 0 && <div className="text-[11px]" style={{ color: COLORS.muted }}>{p.traits.join(" · ")}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Btn full variant="primary" disabled={!canStart} onClick={() => dispatch({ type: "START_HUB" })}>
          <Sparkles size={18} /> התחילו את הערב
        </Btn>
        {!canStart && <p className="mt-2 text-center text-[11px]" style={{ color: COLORS.muted }}>נדרשים 3 שחקנים מחוברים לפחות ומשחק אחד פעיל</p>}
      </div>
    </div>
  );
}

export function HostHub({ room, dispatch, onPodium }) {
  const games = GAME_DEFS.filter((g) => room.enabledGames.includes(g.id));
  const anyScore = room.players.some((p) => p.score > 0 || p.correct > 0 || p.skips > 0 || p.diagnosed > 0);
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-8 md:max-w-xl">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <GlassCard className="mb-6 text-center text-xs font-bold" style={{ color: COLORS.muted }}>
        {room.players.length} שחקנים מחוברים — המסך הזה הוא מסך המנחה, בלי סודות עליו 🙈
      </GlassCard>
      <div className="mb-3 text-sm font-bold" style={{ color: COLORS.muted }}>בחרו משחק</div>
      <div className="space-y-3">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => dispatch({ type: "START_GAME", game: g.id })}
              className="flex w-full items-center gap-4 rounded-2xl border p-4 text-right transition-all active:scale-[0.98]"
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.color}22` }}>
                <Icon size={22} color={g.color} />
              </div>
              <div className="flex-1">
                <div className="font-black" style={{ color: COLORS.text }}>{g.title}</div>
                <div className="text-xs" style={{ color: COLORS.muted }}>{g.desc}</div>
              </div>
              <ChevronLeft size={20} color={COLORS.muted} />
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <Btn full variant="gold" disabled={!anyScore} onClick={onPodium}><Trophy size={18} /> לוח התוצאות</Btn>
      </div>
    </div>
  );
}

export function HostTurnGame({ room, dispatch, gameKey, title, color, stampLabel, onBack, helpTitle, helpSteps, readyCopy, playingCopy }) {
  const g = room[gameKey];
  const turnPlayer = room.players[g.turnIdx];
  const nextPlayer = room.players[(g.turnIdx + 1) % room.players.length];

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar title={`${title} (מסך מנחה)`} onBack={onBack} right={g.phase === "playing" ? `⏱ ${g.timeLeft}` : ""} helpTitle={helpTitle} helpSteps={helpSteps} />

      {g.phase === "ready" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Avatar index={g.turnIdx} name={turnPlayer.name} />
          <div>
            <div className="text-xl font-black" style={{ color: COLORS.text }}>התור של {turnPlayer.name}!</div>
            <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>{readyCopy(turnPlayer.name)}</p>
          </div>
          <Btn variant="primary" onClick={() => dispatch({ type: "START_TURN", game: gameKey })}><Timer size={18} /> התחילו תור</Btn>
        </div>
      )}

      {g.phase === "playing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex w-full items-center justify-center gap-6 text-sm font-bold">
            <span style={{ color: COLORS.emerald }}>✓ {g.correct}</span>
            <span style={{ color: COLORS.coral }}>⏭ {g.skips}</span>
          </div>
          <div style={{ background: `${color}22`, borderColor: color }} className="w-full rounded-2xl border-2 border-dashed p-8">
            <div className="text-lg font-black" style={{ color: COLORS.text }}>{playingCopy(turnPlayer.name)}</div>
          </div>
          <p className="text-xs" style={{ color: COLORS.muted }}>{stampLabel}</p>
        </div>
      )}

      {g.phase === "turnEnd" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{turnPlayer.name} סיים/ה עם {g.correct} נקודות!</div>
          <div className="flex gap-6">
            <div><div className="text-2xl font-black" style={{ color: COLORS.emerald }}>{g.correct}</div><div className="text-xs" style={{ color: COLORS.muted }}>נכונות</div></div>
            <div><div className="text-2xl font-black" style={{ color: COLORS.coral }}>{g.skips}</div><div className="text-xs" style={{ color: COLORS.muted }}>דילוגים</div></div>
          </div>
          <Btn variant="primary" onClick={() => dispatch({ type: "NEXT_TURN", game: gameKey })}><ArrowLeft size={18} /> תור הבא: {nextPlayer.name}</Btn>
          <button onClick={onBack} className="text-xs font-bold" style={{ color: COLORS.muted }}>סיום המשחק וחזרה למרכז</button>
        </div>
      )}
    </div>
  );
}

export function HostWhoAmI({ room, dispatch, onBack }) {
  return (
    <HostTurnGame
      room={room}
      dispatch={dispatch}
      gameKey="whoami"
      title="מי אני?"
      color={COLORS.purple}
      stampLabel="הכרטיס גלוי עכשיו רק בטלפונים של שאר השחקנים"
      onBack={onBack}
      helpTitle="איך משחקים ב'מי אני?' (מסך מנחה)"
      helpSteps={[
        "כל תור שייך לשחקן/ית אחד/ת — עכשיו זה מי שמוצג/ת למעלה.",
        "כשהתור מתחיל, הדמות הסודית מוצגת רק בטלפונים של שאר השחקנים — לא כאן ולא אצל המנחש/ת.",
        "שאר השחקנים מתארים במילים, והמנחש/ת עונה בקול. מי שרואה את הכרטיס לוחץ/ת בטלפון שלו/ה 'הצליח/ה!' או 'דלג'.",
        "המסך הזה רק עוקב אחרי הזמן והניקוד — אין עליו כפתורי ניחוש.",
      ]}
      readyCopy={(name) => `${name} לא יראה/תראה שום דבר במסך שלו/ה. שאר השחקנים יראו את הדמות בטלפונים שלהם ויתארו אותה.`}
      playingCopy={(name) => `ממתינים ש${name} ינחש/תנחש...`}
    />
  );
}

export function HostAlias({ room, dispatch, onBack }) {
  return (
    <HostTurnGame
      room={room}
      dispatch={dispatch}
      gameKey="alias"
      title="אליאס סלון"
      color={COLORS.amber}
      stampLabel="המילה מוצגת רק בטלפון של מי שמסביר/ה עכשיו"
      onBack={onBack}
      helpTitle="איך משחקים ב'אליאס סלון' (מסך מנחה)"
      helpSteps={[
        "כל תור שייך לשחקן/ית אחד/ת שמסביר/ה — עכשיו זה מי שמוצג/ת למעלה.",
        "המילה מוצגת רק בטלפון שלו/ה. שאר השחקנים רואים כאן ובטלפונים שלהם רק את הזמן והניקוד.",
        "המסביר/ה מתאר/ת בלי להגיד את המילה, וכשמנחשים נכון לוחץ/ת בעצמו/ה 'נכון' או 'דלג' בטלפון שלו/ה.",
      ]}
      readyCopy={(name) => `${name} יראה/תראה את הכרטיס בטלפון שלו/ה בלבד ויתאר/תתאר אותו בלי להגיד את המילה.`}
      playingCopy={(name) => `${name} מסביר/ה עכשיו — שאר השחקנים מנחשים בקול`}
    />
  );
}

export function HostShrink({ room, dispatch, onBack }) {
  const s = room.shrink;
  const psych = room.players.find((p) => p.id === s.psychId);
  const others = room.players.filter((p) => p.id !== s.psychId);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6 md:max-w-xl">
      <TopBar
        title="הפסיכולוג (מסך מנחה)"
        onBack={onBack}
        right=""
        helpTitle="איך משחקים ב'הפסיכולוג' (מסך מנחה)"
        helpSteps={[
          "בחרו מי יהיה/תהיה הפסיכולוג/ית הערב מתוך רשימת השחקנים.",
          "לחיצה על 'הקצו כללים' שולחת לכל שאר השחקנים, בסודיות מלאה, כלל התנהגות משלהם — ישירות לטלפון שלהם.",
          "הפסיכולוג/ית מקבל/ת בטלפון שלו/ה לוח אבחון עם כפתורי רמז ואבחנה לכל שחקן/ית.",
          "הניקוד נספר אוטומטית לפי כמות הרמזים שהפסיכולוג/ית השתמש/ה בהם.",
        ]}
      />

      {s.phase === "select" && (
        <div className="flex flex-1 flex-col gap-5">
          <div className="text-center">
            <Stethoscope size={40} color={COLORS.emerald} className="mx-auto" />
            <div className="mt-3 text-xl font-black" style={{ color: COLORS.text }}>מי מאבחן/ת הערב?</div>
            <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>הבחירה תישלח ישירות לטלפון של כל אחד — לא צריך להעביר שום דבר.</p>
          </div>
          <div className="space-y-2">
            {room.players.map((p, i) => (
              <button
                key={p.id}
                onClick={() => dispatch({ type: "SHRINK_SELECT", id: p.id })}
                className="flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right"
                style={{ borderColor: s.psychId === p.id ? COLORS.emerald : COLORS.border, background: s.psychId === p.id ? `${COLORS.emerald}1a` : COLORS.surface }}
              >
                <Avatar index={i} name={p.name} />
                <span className="flex-1 font-bold" style={{ color: COLORS.text }}>{p.name}</span>
                {s.psychId === p.id && <Check size={18} color={COLORS.emerald} />}
              </button>
            ))}
          </div>
          <Btn variant="primary" disabled={!s.psychId} onClick={() => dispatch({ type: "SHRINK_ASSIGN" })}>
            <DoorOpen size={18} /> הקצו כללים סודיים והתחילו
          </Btn>
        </div>
      )}

      {s.phase === "diagnose" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Eye size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name} מאבחן/ת עכשיו</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>הכללים הסודיים כבר נמצאים בטלפונים של {others.map((p) => p.name).join(", ")}</p>
          <div className="w-full space-y-2">
            {others.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border p-3 text-right" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
                <Avatar index={i} name={p.name} />
                <span className="flex-1 font-bold" style={{ color: COLORS.text }}>{p.name}</span>
                <span className="text-xs" style={{ color: COLORS.muted }}>רמזים: {s.clues[p.id]}</span>
                {s.diagnosed[p.id] && <Check size={16} color={COLORS.emerald} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {s.phase === "result" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={48} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name} סיים/ה עם {s.totalScore} נקודות</div>
          <Btn variant="primary" onClick={onBack}><Home size={18} /> חזרה למרכז המשחקים</Btn>
        </div>
      )}
    </div>
  );
}

export function HostPodium({ room, dispatch, onExit }) {
  return (
    <Podium
      players={room.players}
      actions={
        <div className="space-y-2.5">
          <Btn full variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}><RefreshCw size={18} /> סיבוב נוסף</Btn>
          <Btn full variant="ghost" onClick={onExit}><LogOut size={18} /> סגירת החדר</Btn>
        </div>
      }
    />
  );
}

export default function HostApp({ onExit }) {
  const [roomCode] = useState(() => generateRoomCode());
  const [room, localDispatch] = useReducer(roomReducer, null, createInitialRoom);
  const channelRef = useRef(null);

  useEffect(() => {
    const ch = createRoomChannel(normalizeRoomCode(roomCode));
    channelRef.current = ch;
    const unsub = ch.subscribe((msg) => {
      if (msg.type === "ACTION") localDispatch(msg.action);
    });
    return () => { unsub(); ch.close(); };
  }, [roomCode]);

  useEffect(() => {
    channelRef.current?.send({ type: "STATE", room });
  }, [room]);

  useEffect(() => {
    const activeKey = ["whoami", "alias"].find((k) => room.screen === k && room[k]?.phase === "playing");
    if (!activeKey) return;
    const t = setTimeout(() => localDispatch({ type: "TICK", game: activeKey }), 1000);
    return () => clearTimeout(t);
  }, [room]);

  const backToHub = () => localDispatch({ type: "BACK_TO_HUB" });

  return (
    <>
      {room.screen === "lobby" && <HostLobby room={room} dispatch={localDispatch} roomCode={roomCode} onExit={onExit} />}
      {room.screen === "hub" && <HostHub room={room} dispatch={localDispatch} onPodium={() => localDispatch({ type: "GO_PODIUM" })} />}
      {room.screen === "whoami" && <HostWhoAmI room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "shrink" && <HostShrink room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "alias" && <HostAlias room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "podium" && <HostPodium room={room} dispatch={localDispatch} onExit={onExit} />}
    </>
  );
}
