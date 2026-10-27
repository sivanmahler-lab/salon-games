import React, { useEffect, useReducer, useRef, useState } from "react";
import { COLORS } from "../../constants/theme";
import { Avatar, Btn, Chip, GlassCard } from "../common/UIComponents";
import { WHO } from "../../data/salonContent";
import { ROOM_CODE_RE, currentTurn, drawPatch, newRoomCode, pickCharacter, roomPlayers } from "../../game/whoLogic";
import { getRoomTransport } from "../../utils/whoRoomTransport";
import { lsGet, lsSet } from "../../utils/soloHelpers";
import { Lead, Note, Section, TextInput } from "./SoloUI";

const COLOR = COLORS.purple;

/* Who am I, everyone on their own phone. Your character shows on everyone's phone except yours.
   Play does not wait for anyone to find out who they are: after each turn it moves on to the next player. */
export default function WhoRoom({ modeSection }) {
  const [R, setR] = useState(null); // the shared room connection, once it is ready
  const [checked, setChecked] = useState(false); // we have tried to connect
  const [stage, setStage] = useState("setup"); // setup | room
  const [name, setName] = useState(() => lsGet("salon_name"));
  const [code, setCode] = useState(() => lsGet("salon_code") || newRoomCode());
  const [cat, setCat] = useState("all");
  const [, refresh] = useReducer((n) => n + 1, 0);

  // Leave the room when this screen goes away, however that happens.
  const inRoom = useRef(null);
  inRoom.current = stage === "room" ? R : null;
  useEffect(
    () => () => {
      if (inRoom.current) inRoom.current.presence({ code: null, name: null, card: null, cat: null, guessed: null }).catch(() => {});
    },
    []
  );

  useEffect(() => {
    let alive = true;
    let unsubPeers = () => {};
    let unsubConn = () => {};
    getRoomTransport()
      .then((room) => {
        if (!alive) return;
        setR(room);
        setChecked(true);
        unsubPeers = room.onPeers(refresh);
        unsubConn = room.onConnection(refresh);
      })
      .catch(() => alive && setChecked(true));
    return () => {
      alive = false;
      unsubPeers();
      unsubConn();
    };
  }, []);

  const players = R ? roomPlayers(R.peers(), code) : [];

  const enter = () => {
    const nm = name.trim();
    const cd = code.trim();
    if (!R || !nm || !ROOM_CODE_RE.test(cd)) return;
    setName(nm);
    setCode(cd);
    lsSet("salon_name", nm);
    lsSet("salon_code", cd);
    R.presence({ code: cd, name: nm, card: null, cat: null, guessed: false }).catch(() => {});
    setStage("room");
  };

  const leave = () => {
    if (R && stage === "room") R.presence({ code: null, name: null, card: null, cat: null, guessed: null }).catch(() => {});
    setStage("setup");
  };

  const draw = () => {
    if (!R) return;
    R.presence(drawPatch(players, pickCharacter(players, cat))).catch(() => {});
  };
  const passTurn = () => {
    if (!R) return;
    const mine = players.find((p) => p.isMe && p.sameTab);
    R.presence({ done: ((mine && mine.presence.done) || 0) + 1 }).catch(() => {});
  };
  const reveal = () => R && R.presence({ guessed: true }).catch(() => {});
  const newRound = () => R && R.presence({ card: null, cat: null, guessed: false }).catch(() => {});

  if (stage === "setup") {
    const note = R
      ? null
      : checked
      ? "אין חיבור לשרת המשחקים. בדקו את האינטרנט ורעננו את הדף."
      : "בודק חיבור...";
    return (
      <>
        {modeSection}
        <Section title="השם שלכם">
          <TextInput value={name} onChange={setName} maxLength={16} ariaLabel="השם שלכם" />
        </Section>
        <Section title="קוד חדר. כולם מקלידים את אותו קוד">
          <TextInput value={code} onChange={(v) => setCode(v.trim())} maxLength={6} inputMode="numeric" ariaLabel="קוד חדר" />
          <div className="mt-2"><Btn full variant="ghost" onClick={() => setCode(newRoomCode())}>קוד חדש</Btn></div>
        </Section>
        <div className="mt-8"><Btn full variant="primary" disabled={!R} onClick={enter}>כניסה לחדר</Btn></div>
        {note && <p className="mt-3 text-xs" style={{ color: COLORS.muted }}>{note}</p>}
      </>
    );
  }

  const sorted = players.slice().sort((a, b) => (a.peer < b.peer ? -1 : 1));
  const me = sorted.find((p) => p.isMe && p.sameTab);
  const myCard = me && me.presence.card;
  const guessed = !!(me && me.presence.guessed);
  const cur = currentTurn(sorted);
  const myTurn = !!(cur && me && cur.peer === me.peer);
  const anyCards = sorted.some((p) => p.presence.card);
  const connected = R && R.connected();

  return (
    <>
      <div className="flex items-baseline justify-between">
        <Lead color={COLOR}>חדר {code}</Lead>
        <span className="text-xs" style={{ color: COLORS.muted }}>{connected ? `${sorted.length} שחקנים` : "מתחבר..."}</span>
      </div>
      {R && R.error && (
        <p className="mt-2 text-xs" style={{ color: COLORS.coral }}>
          {R.error === "PERMISSION_DENIED" ? "השרת לא מאפשר לשמור את המשחק הזה (הרשאות Firebase)." : "יש בעיה בחיבור לשרת. נסו לרענן."}
        </p>
      )}

      <div
        className="mt-4 flex items-baseline gap-2.5 rounded-2xl border px-4 py-3"
        style={{ borderColor: myTurn ? COLOR : COLORS.border, background: myTurn ? `linear-gradient(135deg, ${COLORS.purple}, #7c3aed)` : "rgba(255,255,255,0.04)" }}
      >
        {cur ? (
          <>
            <span className="text-xs" style={{ color: myTurn ? "#fff" : COLORS.muted }}>התור של</span>
            <b className="text-xl font-black" style={{ color: myTurn ? "#fff" : COLORS.text, fontFamily: "Rubik, sans-serif" }}>
              {cur.presence.name || "שחקן"}{myTurn ? " (אני)" : ""}
            </b>
          </>
        ) : (
          <span className="text-xs" style={{ color: COLORS.muted }}>
            {anyCards ? "כולם ניחשו. אפשר להתחיל סיבוב חדש." : "כל אחד לוחץ על תנו לי דמות, וכשיש דמויות המשחק מתחיל."}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {sorted.length === 0 && <Note>אף אחד עדיין לא נכנס.</Note>}
        {sorted.map((p, i) => {
          const mine = p.isMe && p.sameTab;
          const pr = p.presence;
          const label = (pr.name || "שחקן") + (mine ? " (אני)" : "") + (pr.guessed ? " ✓" : "");
          const card = pr.card || "";
          const body = mine ? (myCard ? (guessed ? card : "?") : "עוד אין דמות") : card || "עוד אין דמות";
          const none = mine ? !myCard : !card;
          return (
            <GlassCard key={p.peer} className="!p-3.5">
              <div
                className="flex items-center gap-3 rounded-2xl"
                style={{ outline: mine ? `1.5px dashed ${COLORS.border}` : "none", outlineOffset: 6, ...(pr.guessed ? { outline: `1.5px solid ${COLORS.emerald}` } : {}) }}
              >
                <Avatar index={i} name={pr.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs" style={{ color: COLORS.muted }}>{label}</div>
                  <div
                    className={`break-words ${none ? "text-sm" : "text-2xl font-black leading-tight"}`}
                    style={{ color: none ? COLORS.muted : COLORS.text, fontFamily: none ? undefined : "Rubik, sans-serif" }}
                  >
                    {body}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <p className="mt-3 text-xs" style={{ color: COLORS.muted }}>
        הדמות שלכם מוצגת אצל כולם חוץ מאצלכם. בתור שלכם שואלים או מנחשים, ואז התור עובר לשחקן הבא.
      </p>

      <Section title="נושא לדמות שלי">
        <div className="flex flex-wrap gap-2">
          {["all", ...Object.keys(WHO)].map((k) => (
            <Chip big key={k} label={k === "all" ? "הכל" : k} color={COLOR} active={cat === k} onClick={() => setCat(k)} />
          ))}
        </div>
      </Section>

      <div className="mt-6 space-y-2.5">
        {!myCard ? (
          <Btn full variant="primary" onClick={draw}>תנו לי דמות</Btn>
        ) : !guessed ? (
          <>
            {myTurn ? (
              <>
                <Btn full variant="primary" onClick={passTurn}>סיימתי תור</Btn>
                <Btn full variant="success" onClick={reveal}>ניחשתי נכון</Btn>
              </>
            ) : (
              <p className="text-center text-sm" style={{ color: COLORS.muted }}>מחכים לתור שלכם.</p>
            )}
            <Btn full variant="ghost" onClick={draw}>דמות אחרת</Btn>
          </>
        ) : (
          <Btn full variant="primary" onClick={newRound}>סיבוב חדש</Btn>
        )}
        <Btn full variant="ghost" onClick={leave}>יציאה מהחדר</Btn>
      </div>
    </>
  );
}
