import React, { useState, useEffect, useRef, useReducer } from "react";
import {
  Users, Sparkles, Timer, Trophy, RefreshCw, Home, ArrowLeft, LogOut,
  ChevronLeft, Check, Copy, Stethoscope, DoorOpen, Eye, ExternalLink, Pause, Play, SkipForward, ThumbsUp, QrCode,
} from "lucide-react";
import { COLORS, CATEGORIES, GAME_DEFS } from "../../constants/theme";
import { createRoomChannel, generateRoomCode, normalizeRoomCode, roomReducer, createInitialRoom } from "../../utils/roomSync";
import { Btn, GlassCard, Avatar, Logo, QRCode, TopBar, WinBanner, HostBarContext, openPlayers } from "../common/UIComponents";
import { Podium } from "./Podium";
import PlayersPanel from "../common/PlayersPanel";
import { notifyJoin } from "../../utils/notify";
import { useEndBeep, useBeepWhen } from "../../utils/soloHelpers";
import { LEXICON } from "../../data/lexicon";
import { HostImposter, HostBoggle } from "./NewGameViews";
import { TEAM_NAMES, teamTotals } from "../../game/aliasLogic";
import ScoreButton from "../common/ScoreButton";
import JoinLeaveToasts from "../common/JoinLeaveToasts";
import { saveNight, loadBoard, clearBoard, shareScores, cheer } from "../../utils/extras";

/* ============================================================================
   HOST — views
============================================================================ */

export function HostLobby({ room, dispatch, roomCode, onExit, kind = "tv" }) {
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(roomCode)}` : roomCode;
  const [copied, setCopied] = useState(false);
  const canStart = room.players.length >= 2;

  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 landscape:max-w-6xl">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: COLORS.muted, background: COLORS.surfaceAlt }}>
          <LogOut size={14} /> סגירת חדר
        </button>
        <Logo />
        <div className="w-[92px]" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto landscape:grid-cols-2 landscape:grid-rows-[minmax(0,1fr)] landscape:content-stretch landscape:overflow-hidden">
        {/* Right side: how to join */}
        <GlassCard className="flex flex-col items-center justify-center gap-2 text-center landscape:min-h-0 landscape:overflow-hidden">
          <QRCode text={joinUrl} />
          <div className="flex items-center gap-2">
            <div className="rounded-xl border px-4 py-2 text-xl font-black tracking-widest" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>
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
          <p className="text-sm" style={{ color: COLORS.muted }}>סרקו את הקוד או הזינו אותו ידנית בטלפון כדי להצטרף</p>
          <p className="max-w-md text-xs leading-relaxed" style={{ color: COLORS.amber }}>
            {kind === "mirror"
              ? "משקפים: את הכפתורים של המנחה לוחצים כאן, במכשיר שמשקף."
              : "דפדפן בטלוויזיה: כדי לא להשתמש בשלט, הצטרפו מהטלפון ולחצו שם על \"שלט מנחה\"."}
          </p>
          {/* Opens the join screen (code already filled in) in a NEW tab, so this host tab, which holds the room, stays open.
              Going "back" in this same tab would close the room, because the room only lives in this tab.
              Not shown in the TV browser: nobody plays from the TV itself. */}
          {kind === "mirror" && (
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold"
            style={{ color: COLORS.text, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}
          >
            <ExternalLink size={14} /> הצטרפות כשחקן מהמכשיר הזה (נפתח בלשונית חדשה)
          </a>
          )}
        </GlassCard>

        {/* Left side: the games and the players */}
        <div className="flex flex-col gap-3 landscape:min-h-0 landscape:overflow-hidden">
          <section className="shrink-0">
            <div className="mb-2 text-sm font-bold" style={{ color: COLORS.muted }}>המשחקים שישוחקו הערב</div>
            {/* on a wide screen (TV) the games sit two in a row, so the players' names below always have room */}
            <div className="grid gap-2 landscape:grid-cols-2 landscape:gap-1.5">
              {GAME_DEFS.map((g) => (
                <div key={g.id} className="flex min-w-0 items-center gap-3 rounded-2xl border px-3.5 py-2 text-right landscape:py-1" style={{ borderColor: g.color, background: `${g.color}1a` }}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold" style={{ color: COLORS.text }}>{g.title}</span>
                    <span className="block text-xs landscape:truncate" style={{ color: COLORS.muted }}>{g.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-1 flex-col landscape:min-h-0 landscape:overflow-hidden">
            <div className="mb-2 flex shrink-0 items-center gap-2 text-sm font-bold" style={{ color: COLORS.muted }}>
              <Users size={16} /> מי הצטרף עד עכשיו ({room.players.length})
            </div>
            {room.players.length === 0 ? (
              <p className="text-xs" style={{ color: COLORS.muted }}>ממתינים שיצטרפו שחקנים מהטלפונים שלהם...</p>
            ) : (
              <div className="grid flex-1 grid-cols-2 content-start gap-2 landscape:min-h-0 landscape:grid-cols-3 landscape:overflow-y-auto">
                {room.players.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-2xl border p-2" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
                    <Avatar index={i} name={p.name} />
                    <div className="min-w-0 flex-1 truncate font-bold" style={{ color: COLORS.text }}>{p.name}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mt-3 shrink-0">
        <Btn full variant="primary" disabled={!canStart} onClick={() => dispatch({ type: "START_HUB" })}>
          <Sparkles size={18} /> התחילו את הערב
        </Btn>
        {!canStart && <p className="mt-1 text-center text-[11px]" style={{ color: COLORS.muted }}>נדרשים 2 שחקנים מחוברים לפחות</p>}
      </div>
    </div>
  );
}

function ImposterWordsButton({ room, dispatch }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState((room.impWords || []).join("\n"));
  const n = (room.impWords || []).length;
  return (
    <>
      <Btn full variant="ghost" onClick={() => setOpen(true)}>✍️ מילים משלנו למתחזה{n ? ` (${n})` : ""}</Btn>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-t-3xl border p-5 md:rounded-3xl" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <div className="font-black" style={{ color: COLORS.text }}>מילים משלנו ל"המתחזה"</div>
            <p className="text-xs" style={{ color: COLORS.muted }}>מילה בכל שורה: שמות של חברים, בדיחות פנימיות, מקומות משותפים. צריך לפחות 2. הן ייכנסו לסיבובים בקטגוריה "המילים שלנו".</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="w-full rounded-xl border bg-transparent p-3 text-sm outline-none" style={{ borderColor: COLORS.border, color: COLORS.text }} placeholder={"למשל:\nהטיול לאילת\nהחתול של דנה"} />
            <div className="flex gap-2">
              <Btn full variant="primary" onClick={() => { dispatch({ type: "SET_IMP_WORDS", words: text.split("\n") }); setOpen(false); }}>שמירה</Btn>
              <Btn variant="ghost" onClick={() => setOpen(false)}>ביטול</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function HostHub({ room, dispatch, onPodium, onLobby }) {
  const games = GAME_DEFS.filter((g) => room.enabledGames.includes(g.id));
  const anyScore = room.players.some((p) => p.score > 0 || p.correct > 0 || p.skips > 0 || p.diagnosed > 0);
  const [impAsk, setImpAsk] = useState(false);
  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 landscape:max-w-5xl">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button onClick={openPlayers} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: COLORS.text, background: COLORS.surfaceAlt }}><QrCode size={16} /> הצג QR לחדר</button>
        <Logo />
        <div className="w-[92px]" />
      </div>
      <GlassCard className="mb-3 shrink-0 text-center text-xs font-bold [@media(max-height:600px)]:hidden" style={{ color: COLORS.muted }}>
        {room.players.length} שחקנים מחוברים — המסך הזה הוא מסך המנחה, בלי סודות עליו 🙈
      </GlassCard>
      <div className="mb-2 shrink-0 text-sm font-bold" style={{ color: COLORS.muted }}>בחרו משחק</div>
      <div className={`grid min-h-0 flex-1 grid-cols-1 content-start gap-3 overflow-y-auto landscape:content-stretch landscape:overflow-y-auto landscape:[grid-auto-rows:minmax(6rem,1fr)] ${games.length >= 7 ? "landscape:grid-cols-4" : games.length >= 4 ? "landscape:grid-cols-3" : "landscape:grid-cols-3"}`}>
        {games.map((g) => {
          const Icon = g.icon;
          const need3 = (g.id === "imposter" || g.id === "shrink") && room.players.length < 3;
          return (
            <button
              key={g.id}
              disabled={need3}
              onClick={() => (g.id === "imposter" ? setImpAsk(true) : dispatch({ type: "START_GAME", game: g.id }))}
              className={`flex w-full ${need3 ? "opacity-40" : ""} items-center gap-4 rounded-2xl border p-4 text-right transition-all active:scale-[0.98] landscape:flex-col landscape:justify-center landscape:text-center`}
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.color}22` }}>
                <Icon size={22} color={g.color} />
              </div>
              <div className="flex-1">
                <div className="font-black" style={{ color: COLORS.text }}>{g.title}</div>
                <div className="text-xs" style={{ color: COLORS.muted }}>{need3 ? "דרושים 3 שחקנים לפחות" : g.desc}</div>
              </div>
              <ChevronLeft size={20} color={COLORS.muted} className="landscape:hidden" />
            </button>
          );
        })}
      </div>
      {/* "המתחזה" was chosen: start right away, or first add the group's own secret words */}
      {impAsk && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={() => setImpAsk(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-t-3xl border p-5 text-center md:rounded-3xl" style={{ background: COLORS.surface, borderColor: COLORS.border }}>
            <div className="text-lg font-black" style={{ color: COLORS.text }}>המתחזה</div>
            <Btn full variant="primary" onClick={() => { setImpAsk(false); dispatch({ type: "START_GAME", game: "imposter" }); }}><Play size={18} /> מתחילים</Btn>
            <ImposterWordsButton room={room} dispatch={dispatch} />
            <Btn full variant="ghost" onClick={() => setImpAsk(false)}>ביטול</Btn>
          </div>
        </div>
      )}
      <div className="mt-3 shrink-0">
        <Btn full variant="gold" disabled={!anyScore} onClick={onPodium}><Trophy size={18} /> לוח התוצאות</Btn>
      </div>
      <div className="mt-2 shrink-0">
        <Btn full variant="ghost" onClick={onLobby}>חזרה להגדרות הערב (להוסיף או להסיר משחקים)</Btn>
      </div>
    </div>
  );
}

export function HostTurnGame({ room, dispatch, gameKey, title, color, stampLabel, onBack, helpTitle, helpSteps, readyCopy, playingCopy }) {
  const g = room[gameKey];
  const turnPlayer = room.players[g.turnIdx];
  const nextPlayer = room.players[(g.turnIdx + 1) % room.players.length];
  useEndBeep(g.timeLeft);
  const teams = gameKey === "alias" && g.mode === "teams";
  const totals = teams ? teamTotals(room.players) : [0, 0];
  const teamName = (idx) => TEAM_NAMES[idx % 2];

  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 md:max-w-xl landscape:max-w-5xl">
      <TopBar title={`${title} (מסך מנחה)`} onBack={onBack} right={g.phase === "playing" ? `⏱ ${g.timeLeft}` : ""} helpTitle={helpTitle} helpSteps={helpSteps} />
      {teams && (
        <div className="flex shrink-0 justify-center gap-4 pt-1 text-sm font-black">
          {TEAM_NAMES.map((n, i) => (
            <span key={n} className="rounded-xl border px-3 py-1" style={{ borderColor: i === g.turnIdx % 2 ? COLORS.amber : COLORS.border, color: i === g.turnIdx % 2 ? COLORS.amber : COLORS.muted }}>{n}: {totals[i]}</span>
          ))}
        </div>
      )}

      {g.phase === "ready" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Avatar index={g.turnIdx} name={turnPlayer.name} />
          <div>
            <div className="text-xl font-black" style={{ color: COLORS.text }}>התור של {turnPlayer.name}{teams ? ` (${teamName(g.turnIdx)})` : ""}!</div>
            <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>{readyCopy(turnPlayer.name)}</p>
          </div>
          <Btn variant="primary" onClick={() => dispatch({ type: "START_TURN", game: gameKey })}><Timer size={18} /> התחילו תור</Btn>
        </div>
      )}

      {g.phase === "playing" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
          {room.paused ? (
            <div className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 p-5" style={{ borderColor: COLORS.amber, background: `${COLORS.amber}1a` }}>
              <div className="text-lg font-black" style={{ color: COLORS.amber }}>⏸ המשחק מושהה</div>
              <p className="text-xs" style={{ color: COLORS.muted }}>בכל הטלפונים מופיע שלחצת PAUSE והשעון עומד.</p>
              <Btn variant="gold" onClick={() => dispatch({ type: "SET_PAUSED", value: false })}><Play size={18} /> המשך</Btn>
            </div>
          ) : (
            <Btn variant="subtle" onClick={() => dispatch({ type: "SET_PAUSED", value: true })}><Pause size={18} /> PAUSE</Btn>
          )}
          <div className="flex w-full items-center justify-center gap-6 text-sm font-bold">
            <span style={{ color: COLORS.emerald }}>נכונות: {g.correct}</span>
            <span style={{ color: COLORS.coral }}>דילוגים: {g.skips}</span>
          </div>
          {gameKey === "whoami" && <WinBanner won={g.won} />}
          <div style={{ background: `${color}22`, borderColor: color }} className="w-full rounded-2xl border-2 border-dashed p-4">
            <div className="text-lg font-black" style={{ color: COLORS.text }}>{playingCopy(turnPlayer.name)}</div>
          </div>
          {gameKey === "whoami" && !room.paused && (
            <div className="grid w-full grid-cols-2 gap-3">
              <Btn variant="danger" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "skip", cursor: g.cursor })}><SkipForward size={18} /> דלג</Btn>
              <Btn variant="primary" onClick={() => dispatch({ type: "RESULT", game: "whoami", result: "correct", cursor: g.cursor })}><ThumbsUp size={18} /> הצליח/ה!</Btn>
            </div>
          )}
          <p className="text-xs" style={{ color: COLORS.muted }}>{stampLabel}</p>
        </div>
      )}

      {g.phase === "turnEnd" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>
            {gameKey === "alias" && g.mode === "solo"
              ? `${turnPlayer.name} הסביר/ה ${g.correct} מילים שנוחשו נכון`
              : `${turnPlayer.name} סיים/ה עם ${g.correct} נקודות!`}
          </div>
          {gameKey === "alias" && g.mode === "solo" && (
            <div className="flex flex-wrap justify-center gap-2 text-sm font-bold" style={{ color: COLORS.amber }}>
              {room.players.filter((p) => g.guessed?.[p.id]).map((p) => <span key={p.id}>{p.name} +{g.guessed[p.id]}</span>)}
            </div>
          )}
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
        "שאר השחקנים מתארים במילים, והמנחש/ת עונה בקול. המנחה לוחץ/ת כאן במסך על 'הצליח/ה!' או 'דלג'.",
        "כפתורי 'הצליח/ה!' ו'דלג' נמצאים רק במסך המנחה, לא בטלפונים.",
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
        "עד 6 שחקנים: כשמישהו מנחש נכון, המסביר/ה לוחץ/ת בטלפון על שמו, והוא/היא מקבל/ת נקודה (וגם המסביר/ה). מעל 6 שחקנים: משחקים בשתי קבוצות, והנקודה הולכת לקבוצה של המסביר/ה.",
        "אם לא מצליחים, המסביר/ה לוחץ/ת 'דלג'.",
      ]}
      readyCopy={(name) => room.alias.mode === "teams"
        ? `${name} יראה/תראה מילה בטלפון שלו/ה בלבד ויסביר/תסביר אותה בעל פה בלי להגיד אותה. חברי הקבוצה מנחשים בקול, וכל מילה שנוחשה נכון שווה נקודה לקבוצה. יש 60 שניות.`
        : `${name} יראה/תראה מילה בטלפון שלו/ה בלבד ויסביר/תסביר אותה בעל פה בלי להגיד אותה. שאר השחקנים מנחשים בקול, והמסביר/ה מסמן/ת בטלפון מי ניחש. מי שניחש נכון מקבל נקודה, וגם המסביר/ה מקבל/ת נקודה על כל מילה. יש 60 שניות.`}
      playingCopy={(name) => `${name} מסביר/ה עכשיו — שאר השחקנים מנחשים בקול`}
    />
  );
}

export function HostLexicon({ room, dispatch, onBack }) {
  const L = room.lexicon;
  if (L.phase === "level") {
    return (
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col items-center justify-center gap-5 px-5 text-center md:max-w-xl">
        <div className="text-2xl font-black" style={{ color: COLORS.text }}>לקסיקון לועזי-עברי</div>
        <p className="text-sm" style={{ color: COLORS.muted }}>בחרו רמת קושי</p>
        <Btn full variant="primary" onClick={() => dispatch({ type: "LEX_LEVEL", level: "easy" })}>קל: כל המילים, כולל הקלות</Btn>
        <Btn full variant="gold" onClick={() => dispatch({ type: "LEX_LEVEL", level: "hard" })}>קשה: רק המילים הקשות</Btn>
        <Btn variant="ghost" onClick={onBack}>חזרה למרכז המשחקים</Btn>
      </div>
    );
  }
  return <HostLexiconPlay room={room} dispatch={dispatch} onBack={onBack} />;
}

function HostLexiconPlay({ room, dispatch, onBack }) {
  const L = room.lexicon;
  const entry = LEXICON[L.wordIdx];
  const nameOf = (id) => room.players.find((p) => p.id === id)?.name || "?";
  const submitted = room.players.filter((p) => L.defs[p.id]);
  const voted = room.players.filter((p) => L.votes[p.id]);
  useBeepWhen(room.players.length > 0 && voted.length === room.players.length);
  const allSent = room.players.length > 0 && submitted.length === room.players.length;
  useBeepWhen(L.phase === "write" && allSent);
  const compact = L.phase === "vote" || L.phase === "result";
  const cardText = { fontSize: "clamp(0.7rem, min(3.6vw, 2.2vh), 1.05rem)", lineHeight: 1.25 };

  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-5 pb-3 pt-3 md:max-w-xl landscape:max-w-5xl">
      <TopBar
        title="לקסיקון לועזי-עברי (מסך מנחה)"
        onBack={onBack}
        right=""
        helpTitle="איך משחקים ב'לקסיקון לועזי-עברי'"
        helpSteps={[
          "מוצגת מילה לועזית. מי שמכיר אותה לוחץ בטלפון על \"מכיר\" והמילה מוחלפת. כשכולם לוחצים \"לא מכיר\", כל שחקן ממציא הגדרה בעברית, בדויה אבל משכנעת.",
          "כשכולם שלחו, מוצגות כל ההגדרות בערבוב, יחד עם ההגדרה האמיתית. כולם מצביעים בטלפון על ההגדרה שנראית להם אמיתית.",
          "מי שמצא את ההגדרה האמיתית מקבל נקודה. מי שההגדרה הבדויה שלו קיבלה קולות מקבל נקודה נוספת על כל קול.",
        ]}
      />

      <div className={`flex min-h-0 flex-1 flex-col items-center text-center ${compact ? "justify-start gap-1.5" : "justify-center gap-3"}`}>
        {!compact && <div className="text-xs font-bold" style={{ color: COLORS.sky }}>המילה הלועזית</div>}
        <div className="font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif", fontSize: compact ? "clamp(1.4rem, min(7vw, 5vh), 2.4rem)" : "clamp(2rem, min(10vw, 12vh), 5rem)" }}>{entry.w}</div>

        {L.notice && L.phase === "check" && (
          <div className="rounded-xl border px-3 py-1.5 text-sm font-bold" style={{ borderColor: COLORS.amber, color: COLORS.amber }}>
            {L.notice.swapped ? `המילה הקודמת (${L.notice.word}) הוחלפה על ידי ${L.notice.by}` : `המילה הקודמת (${L.notice.word}) הייתה מוכרת ל${L.notice.by}, ולכן הוחלפה`}
          </div>
        )}
        {L.phase === "check" && (
          <>
            <p className="text-sm" style={{ color: COLORS.muted }}>מי שמכיר/ה את המילה לוחצ/ת בטלפון על "מכיר". אם מישהו מכיר, מחליפים מילה. כשכולם לוחצים "לא מכיר", מתחילים.</p>
            <div className="text-lg font-black" style={{ color: COLORS.amber }}>{Object.keys(L.seen || {}).length} מתוך {room.players.length} ענו "לא מכיר"</div>
            <Btn variant="ghost" onClick={() => dispatch({ type: "LEX_START_WRITE" })}>מתחילים בלי לחכות לכולם</Btn>
            <div className="flex flex-wrap justify-center gap-2">
              <Btn variant="ghost" onClick={() => dispatch({ type: "LEX_SKIP" })}>🔄 החלפת מילה</Btn>
              {L.prev && <Btn variant="ghost" onClick={() => dispatch({ type: "LEX_BACK_WORD" })}>↩ חזרה למילה הקודמת ({LEXICON[L.prev.wordIdx].w})</Btn>}
            </div>
          </>
        )}
        {L.phase === "write" && (
          <>
            <p className="text-sm" style={{ color: COLORS.muted }}>כל אחד כותב בטלפון הגדרה בדויה שנשמעת אמיתית</p>
            <div className="text-lg font-black" style={{ color: COLORS.amber }}>{submitted.length} מתוך {room.players.length} שלחו</div>
            <div className="flex flex-wrap justify-center gap-2">
              {room.players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-bold" style={{ borderColor: L.defs[p.id] ? COLORS.emerald : COLORS.border, color: L.defs[p.id] ? COLORS.emerald : COLORS.muted }}>
                  <Avatar index={i} name={p.name} /> {p.name} {L.defs[p.id] ? "✓" : ""}
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: COLORS.muted }}>אפשר לתקן הגדרה שנשלחה, עד שחושפים את ההגדרות</p>
            <Btn variant="primary" disabled={submitted.length < 1} onClick={() => dispatch({ type: "LEX_TO_VOTE" })}><Eye size={18} /> {allSent ? "כולם שלחו ✓ חושפים את ההגדרות" : "לא מחכים לכולם? חושפים את ההגדרות"}</Btn>
            <Btn variant="ghost" onClick={() => dispatch({ type: "LEX_SKIP" })}>🔄 החלפת מילה</Btn>
          </>
        )}

        {L.phase === "vote" && (
          <>
            <p className="text-xs" style={{ color: COLORS.muted }}>המנחה מקריא את ההגדרות בקול, ומצביעים בטלפון על המספר ({voted.length} מתוך {room.players.length})</p>
            <div className="flex flex-wrap justify-center gap-1">
              {room.players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[11px] font-bold" style={{ borderColor: L.votes[p.id] ? COLORS.emerald : COLORS.border, color: L.votes[p.id] ? COLORS.emerald : COLORS.muted }}>
                  {p.name} {L.votes[p.id] ? "✓" : ""}
                </div>
              ))}
            </div>
            <div className="grid min-h-0 w-full flex-1 gap-1.5 [grid-auto-rows:minmax(0,1fr)] landscape:grid-flow-col landscape:[grid-template-rows:repeat(var(--rows),minmax(0,1fr))]" style={{ "--rows": Math.ceil(L.options.length / 2) }}>
              {L.options.map((o, i) => (
                <div key={o.id} className="flex min-h-0 items-center gap-2 overflow-hidden rounded-xl border px-2 py-1 text-right font-bold" style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.text }}>
                  <span className="flex h-[1.8em] w-[1.8em] shrink-0 items-center justify-center rounded-full text-sm font-black" style={{ background: `${COLORS.sky}33`, color: COLORS.sky }}>{i + 1}</span>
                  <span className="flex-1" style={cardText}>{o.text}</span>
                </div>
              ))}
            </div>
            <Btn variant="primary" onClick={() => dispatch({ type: "LEX_REVEAL" })}><Eye size={18} /> חשפו את התשובה</Btn>
            <div className="flex flex-wrap justify-center gap-2">
              <Btn variant="ghost" onClick={() => dispatch({ type: "LEX_BACK_WRITE" })}>↩ חזרה לכתיבת ההגדרות</Btn>
              <Btn variant="ghost" onClick={() => dispatch({ type: "LEX_SKIP" })}>🔄 החלפת מילה</Btn>
            </div>
          </>
        )}

        {L.phase === "result" && (
          <>
            <div className="grid min-h-0 w-full flex-1 gap-1.5 [grid-auto-rows:minmax(0,1fr)] landscape:grid-flow-col landscape:[grid-template-rows:repeat(var(--rows),minmax(0,1fr))]" style={{ "--rows": Math.ceil(L.options.length / 2) }}>
              {L.options.map((o) => {
                const who = room.players.filter((p) => L.votes[p.id] === o.id).map((p) => p.name);
                const real = o.owner === null;
                return (
                  <div key={o.id} className="flex min-h-0 flex-col justify-center overflow-hidden rounded-xl border px-2 py-1 text-right" style={{ ...cardText, borderColor: real ? COLORS.emerald : COLORS.border, background: real ? `${COLORS.emerald}1a` : COLORS.surface }}>
                    <div className="font-bold" style={{ color: COLORS.text }}>{o.text}</div>
                    <div className="mt-0.5 text-[0.85em]" style={{ color: real ? COLORS.emerald : COLORS.muted }}>
                      {real ? "✓ ההגדרה האמיתית" : `הומצאה על ידי ${nameOf(o.owner)}`}{who.length ? ` · הצביעו: ${who.join(", ")}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs font-bold" style={{ color: COLORS.amber }}>
              {room.players.filter((p) => L.gains[p.id]).map((p) => <span key={p.id}>{p.name} +{L.gains[p.id]}</span>)}
            </div>
            <Btn variant="primary" onClick={() => dispatch({ type: "LEX_NEXT" })}><RefreshCw size={18} /> סיבוב נוסף</Btn>
          </>
        )}
      </div>
    </div>
  );
}

export function HostShrink({ room, dispatch, onBack }) {
  const s = room.shrink;
  const psych = room.players.find((p) => p.id === s.psychId);
  const others = room.players.filter((p) => p.id !== s.psychId);
  useBeepWhen(!!s.found);

  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-5 pb-4 pt-4 md:max-w-xl landscape:max-w-5xl">
      <TopBar
        title="הפסיכולוג (מסך מנחה)"
        onBack={onBack}
        right=""
        helpTitle="איך משחקים ב'הפסיכולוג' (מסך מנחה)"
        helpSteps={[
          "בחרו מי יהיה/תהיה הפסיכולוג/ית הערב מתוך רשימת השחקנים.",
          "לחיצה על 'הקצו כללים' שולחת לכל שאר השחקנים את אותו כלל סודי, ישירות לטלפון שלהם.",
          "הפסיכולוג/ית מקבל/ת הודעה שעליו/ה לגלות את הכלל בשאלות לשחקנים, עם כפתורי רמז וגילוי.",
          "הניקוד נספר אוטומטית לפי כמות הרמזים שנוצלו.",
        ]}
      />

      {s.phase === "select" && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="shrink-0 text-center">
            <Stethoscope size={40} color={COLORS.emerald} className="mx-auto" />
            <div className="mt-3 text-xl font-black" style={{ color: COLORS.text }}>מי מאבחן/ת הערב?</div>
            <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>הבחירה תישלח ישירות לטלפון של כל אחד — לא צריך להעביר שום דבר.</p>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-y-auto landscape:grid-cols-2">
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
          <Btn variant="primary" className="shrink-0" disabled={!s.psychId} onClick={() => dispatch({ type: "SHRINK_ASSIGN" })}>
            <DoorOpen size={18} /> הקצו כללים סודיים והתחילו
          </Btn>
        </div>
      )}

      {s.phase === "diagnose" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Eye size={44} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name} מאבחן/ת עכשיו</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>כל השחקנים מלבדו/ה ({others.map((p) => p.name).join(", ")}) קיבלו את אותו כלל סודי, והוא/היא צריך/ה לגלות אותו בשאלות.</p>
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: COLORS.muted }}>
            רמזים: {s.clues} {s.found && <Check size={16} color={COLORS.emerald} />}
          </div>
          {!s.found && (
            <>
              <Btn variant="primary" onClick={() => dispatch({ type: "SHRINK_DIAGNOSE" })}><Check size={18} /> הצליח/ה לגלות את הכלל</Btn>
              <Btn variant="subtle" onClick={() => dispatch({ type: "SHRINK_REROLL" })}><RefreshCw size={16} /> לא בא לנו על הכלל הזה, החליפו כלל</Btn>
            </>
          )}
          {s.found && s.rule && (
            <>
              <div className="rounded-2xl border-2 px-6 py-4" style={{ borderColor: COLORS.emerald, background: `${COLORS.emerald}22` }}>
                <div className="text-sm font-bold" style={{ color: COLORS.emerald }}>🎉 {psych?.name} גילה/תה! הכלל היה</div>
                <div className="text-2xl font-black" style={{ color: COLORS.text }}>{s.rule}</div>
              </div>
              <Btn variant="primary" onClick={() => dispatch({ type: "SHRINK_AGAIN" })}><RefreshCw size={18} /> סיבוב נוסף</Btn>
            </>
          )}
        </div>
      )}

      {s.phase === "result" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Trophy size={48} color={COLORS.amber} />
          <div className="text-xl font-black" style={{ color: COLORS.text }}>{psych?.name} סיים/ה עם {s.totalScore} נקודות</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>הכלל היה: {s.rule}</p>
          <Btn variant="primary" onClick={() => dispatch({ type: "SHRINK_NEXT" })}><RefreshCw size={18} /> סבב הבא</Btn>
          <button onClick={onBack} className="text-xs font-bold" style={{ color: COLORS.muted }}>חזרה למרכז המשחקים</button>
        </div>
      )}
    </div>
  );
}

export function BoardButton() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const board = loadBoard();
  const rows = Object.entries(board).map(([name, r]) => ({ name, ...r })).sort((a, b) => b.points - a.points);
  return (
    <>
      <Btn full variant="ghost" onClick={() => setOpen(true)}>📊 כל הערבים</Btn>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85dvh] w-full max-w-md flex-col gap-2 overflow-y-auto rounded-t-3xl border p-5 md:rounded-3xl" style={{ background: COLORS.surface, borderColor: COLORS.border }} data-tick={tick}>
            <div className="font-black" style={{ color: COLORS.text }}>טבלת כל הערבים (נשמרת במכשיר הזה)</div>
            {rows.length === 0 && <p className="text-sm" style={{ color: COLORS.muted }}>עוד אין ערבים שמורים. הניקוד נשמר כשמגיעים ללוח התוצאות.</p>}
            {rows.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 rounded-2xl border px-3 py-2" style={{ borderColor: COLORS.border, background: COLORS.surfaceAlt }}>
                <span className="w-5 text-center text-sm font-black" style={{ color: COLORS.muted }}>{i + 1}</span>
                <span className="flex-1 truncate font-bold" style={{ color: COLORS.text }}>{r.name}</span>
                <span className="text-[11px]" style={{ color: COLORS.muted }}>{r.nights} ערבים</span>
                <span className="text-lg font-black" style={{ color: COLORS.amber }}>{r.points}</span>
              </div>
            ))}
            {rows.length > 0 && <button onClick={() => { if (window.confirm("למחוק את כל הטבלה?")) { clearBoard(); setTick(tick + 1); setOpen(false); } }} className="pt-1 text-center text-xs font-bold" style={{ color: COLORS.coral }}>איפוס הטבלה</button>}
          </div>
        </div>
      )}
    </>
  );
}

export function HostPodium({ room, dispatch, onExit }) {
  return (
    <Podium
      tv
      players={room.players}
      actions={
        <div className="space-y-2.5">
          <Btn full variant="primary" onClick={() => dispatch({ type: "BACK_TO_HUB" })}><ArrowLeft size={18} /> חזרה למשחקים</Btn>
          <div className="grid grid-cols-2 gap-2">
            <Btn full variant="gold" onClick={() => shareScores(room.players)}>📤 שיתוף תמונה</Btn>
            <BoardButton />
          </div>
          <Btn full variant="ghost" onClick={onExit}><LogOut size={18} /> סגירת החדר</Btn>
        </div>
      }
    />
  );
}

const SETUP = {
  tv: {
    title: "מציגים בדפדפן של הטלוויזיה",
    steps: [
      "ודאו שהאתר פתוח בדפדפן של הטלוויזיה החכמה, בגודל מלא.",
      "בהמשך יופיע על המסך ברקוד (QR) וקוד חדר. כל מי שרוצה לשחק סורק אותו מהטלפון שלו.",
      "בטלוויזיה אפשר ללחוץ על הכפתורים עם השלט, כמו עכבר. נוח יותר: מצטרפים מהטלפון ולוחצים שם על \"שלט מנחה\".",
    ],
  },
  mirror: {
    title: "משקפים את המסך לטלוויזיה",
    steps: [
      "פתחו את האתר במחשב או בטלפון, ושקפו אותו לטלוויזיה (Chromecast, AirPlay, Miracast או כבל HDMI).",
      "ודאו שהמסך נראה בטלוויזיה. הכי יפה כשהטלפון מוטה לרוחב.",
      "בהמשך יופיע ברקוד (QR) וקוד חדר. כל מי שרוצה לשחק סורק אותו מהטלפון שלו.",
      "את כפתורי המנחה לוחצים במכשיר שמשקף.",
    ],
  },
};

// A short step before the code appears: the host decides how the main screen is shown.
function HostSetup({ kind, onContinue, onBack }) {
  const info = SETUP[kind] || SETUP.tv;
  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-5 px-6 py-6 landscape:max-w-2xl">
      <div className="flex justify-center"><Logo /></div>
      <div className="text-center text-xl font-black" style={{ color: COLORS.text }}>{info.title}</div>
      <ol className="list-decimal space-y-2 pr-5 text-sm leading-relaxed" style={{ color: COLORS.muted }}>
        {info.steps.map((t) => <li key={t}>{t}</li>)}
      </ol>
      <Btn full variant="primary" onClick={onContinue}><Sparkles size={18} /> הכול מוכן, הציגו את הקוד</Btn>
      <button onClick={onBack} className="text-center text-xs font-bold" style={{ color: COLORS.muted }}>חזרה</button>
    </div>
  );
}

export default function HostApp({ onExit, kind = "tv", resume = null }) {
  const [setupDone, setSetupDone] = useState(!!resume); // a phone taking over skips the setup steps
  const [roomCode] = useState(() => resume?.roomCode || generateRoomCode());
  const [room, localDispatch] = useReducer(roomReducer, null, () => (resume?.room ? { ...resume.room, paused: false } : createInitialRoom()));
  const channelRef = useRef(null);
  const roomRef = useRef(room);
  roomRef.current = room;

  useEffect(() => {
    const ch = createRoomChannel(normalizeRoomCode(roomCode));
    channelRef.current = ch;
    const unsub = ch.subscribe((msg) => {
      if (msg.type !== "ACTION") return;
      if (msg.action.type === "SYNC") ch.send({ type: "STATE", room: roomRef.current }); // a phone came back and wants to catch up
      else localDispatch(msg.action);
      if (msg.action.type === "JOIN") {
        const before = roomRef.current.players.length;
        const isNew = !roomRef.current.players.some((p) => p.id === msg.action.id || p.name.trim() === String(msg.action.name || "").trim());
        setTimeout(() => {
          ch.send({ type: "STATE", room: roomRef.current });
          if (isNew) notifyJoin(msg.action.name, roomCode, before + 1);
        }, 300);
      }
    });
    return () => { unsub(); ch.close(); };
  }, [roomCode]);

  useEffect(() => {
    channelRef.current?.send({ type: "STATE", room });
  }, [room]);

  // Heartbeat: repeat the current state every few seconds, so a phone that missed an update catches up by itself.
  useEffect(() => {
    const t = setInterval(() => channelRef.current?.send({ type: "STATE", room: roomRef.current }), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const activeKey = ["whoami", "alias"].find((k) => room.screen === k && room[k]?.phase === "playing") || (room.screen === "boggle" && room.boggle?.phase === "play" ? "boggle" : null);
    if (!activeKey || room.paused) return;
    const t = setTimeout(() => localDispatch(activeKey === "boggle" ? { type: "BOG_TICK" } : { type: "TICK", game: activeKey }), 1000);
    return () => clearTimeout(t);
  }, [room]);

  const backToHub = () => localDispatch({ type: "BACK_TO_HUB" });

  // The host screen is usually a TV, seen from across the room: scale all sizes with the screen height.
  useEffect(() => {
    const el = document.documentElement;
    const before = el.style.fontSize;
    el.style.fontSize = "clamp(16px, 2.3vh, 44px)";
    return () => { el.style.fontSize = before; };
  }, []);

  // The end of the evening: remember the points in the all-evenings scoreboard, and cheer.
  useEffect(() => {
    if (room.screen === "podium") { saveNight(roomCode, room.players); cheer(); }
  }, [room.screen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!setupDone) return <HostSetup kind={kind} onContinue={() => setSetupDone(true)} onBack={onExit} />;

  const joinUrl = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(roomCode)}`;
  const turnKey = room.screen === "whoami" || room.screen === "alias" ? room.screen : null;

  return (
    <HostBarContext.Provider value={true}>
      <JoinLeaveToasts players={room.players} />
      {["hub", "whoami", "alias", "lexicon", "shrink", "imposter", "boggle", "podium"].includes(room.screen) && (
        <PlayersPanel room={room} dispatch={localDispatch} joinUrl={joinUrl} roomCode={roomCode} gameKey={turnKey} onBack={room.screen === "hub" ? null : backToHub} onExit={onExit} hideButton={room.screen !== "podium"} />
      )}
      {["hub", "whoami", "alias", "lexicon", "shrink", "imposter", "boggle"].includes(room.screen) && <ScoreButton hideButton title="לוח התוצאות" rows={room.players.map((p) => ({ name: p.name, score: p.score || 0 }))} />}
      {room.screen === "lobby" && <HostLobby room={room} dispatch={localDispatch} roomCode={roomCode} onExit={onExit} kind={kind} />}
      {room.screen === "hub" && <HostHub room={room} dispatch={localDispatch} onPodium={() => localDispatch({ type: "GO_PODIUM" })} onLobby={() => localDispatch({ type: "BACK_TO_LOBBY" })} />}
      {room.screen === "whoami" && <HostWhoAmI room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "imposter" && <HostImposter room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "boggle" && <HostBoggle room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "lexicon" && <HostLexicon room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "shrink" && <HostShrink room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "alias" && <HostAlias room={room} dispatch={localDispatch} onBack={backToHub} />}
      {room.screen === "podium" && <HostPodium room={room} dispatch={localDispatch} onExit={onExit} />}
    </HostBarContext.Provider>
  );
}
