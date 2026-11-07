import React, { useState, useEffect } from "react";
import { Home, ArrowLeft, Trophy, Eye, EyeOff, RefreshCw, Play, Check } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { Btn, Avatar, TopBar } from "../common/UIComponents";
import { useBeepWhen } from "../../utils/soloHelpers";
import { imposterTally, boggleIndex, boggleScores, wordPoints } from "../../game/newGames";

/* Screens of the two newer games: "המתחזה" (imposter) and Hebrew Boggle.
   The host screen never shows the secret word or who the imposter is (until the reveal). */

const hostWrap = "relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-5 pb-12 pt-3 md:max-w-xl landscape:max-w-5xl";
const phoneWrap = "relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col gap-3 overflow-hidden px-5 pb-14 pt-10 landscape:max-w-3xl";
const nameOf = (room, id) => room.players.find((p) => p.id === id)?.name || "?";

function Chips({ room, done }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {room.players.map((p) => (
        <div key={p.id} className="rounded-lg border px-2 py-0.5 text-xs font-bold" style={{ borderColor: done(p.id) ? COLORS.emerald : COLORS.border, color: done(p.id) ? COLORS.emerald : COLORS.muted }}>
          {p.name} {done(p.id) ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}

/* ============================ IMPOSTER ============================ */
export function HostImposter({ room, dispatch, onBack }) {
  const I = room.imposter;
  const seenN = Object.keys(I.seen).length;
  const votedN = Object.keys(I.votes).length;
  useBeepWhen(room.players.length > 0 && votedN === room.players.length);
  const tally = imposterTally(room.players, I.votes);
  return (
    <div className={hostWrap}>
      <TopBar
        title={`המתחזה, סבב ${I.round}`}
        onBack={onBack}
        right=""
        helpTitle="איך משחקים ב'המתחזה'"
        helpSteps={[
          "כל השחקנים מקבלים בטלפון את אותה מילה סודית, חוץ משחקן אחד, המתחזה, שיודע רק את הקטגוריה.",
          "כל אחד בתורו אומר מילה או משפט קצר שקשורים למילה, בלי להגיד אותה. המתחזה מנסה להישמע כאילו הוא יודע.",
          "אחרי שיחה חופשית כולם מצביעים בטלפון מי המתחזה.",
          "אם המתחזה נתפס, הוא יכול עוד לנסות לנחש את המילה.",
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
        {I.phase === "reveal" && (
          <>
            <div className="text-2xl font-black" style={{ color: COLORS.text }}>הקטגוריה: {I.cat}</div>
            <p className="text-sm" style={{ color: COLORS.muted }}>כולם מציצים בטלפון בסתר: מי שקיבל/ה מילה זוכר/ת אותה, ומי שכתוב לו/לה "אתה המתחזה" מחזיק/ה את הסוד</p>
            <div className="text-lg font-black" style={{ color: COLORS.amber }}>{seenN} מתוך {room.players.length} ראו</div>
            <Chips room={room} done={(id) => I.seen[id]} />
            <Btn variant="ghost" onClick={() => dispatch({ type: "IMP_TO_TALK" })}>מתחילים בלי לחכות לכולם</Btn>
          </>
        )}
        {I.phase === "talk" && (
          <>
            <div className="text-2xl font-black" style={{ color: COLORS.text }}>הקטגוריה: {I.cat}</div>
            <p className="text-sm" style={{ color: COLORS.muted }}>כל אחד בתורו אומר מילה או משפט קצר שקשורים למילה הסודית. אחר כך דיון חופשי.</p>
            <ol className="flex flex-wrap justify-center gap-2">
              {I.order.map((id, i) => (
                <li key={id} className="rounded-xl border px-3 py-1.5 text-base font-black" style={{ borderColor: COLORS.border, color: COLORS.text }}>{i + 1}. {nameOf(room, id)}</li>
              ))}
            </ol>
            <Btn variant="primary" onClick={() => dispatch({ type: "IMP_TO_VOTE" })}><ArrowLeft size={18} /> עוברים להצבעה</Btn>
          </>
        )}
        {I.phase === "vote" && (
          <>
            <div className="text-2xl font-black" style={{ color: COLORS.text }}>מי המתחזה?</div>
            <p className="text-sm" style={{ color: COLORS.muted }}>מצביעים בטלפון ({votedN} מתוך {room.players.length})</p>
            <Chips room={room} done={(id) => I.votes[id]} />
            <Btn variant="ghost" onClick={() => dispatch({ type: "IMP_REVEAL" })}>חשפו את התוצאה</Btn>
          </>
        )}
        {I.phase === "guess" && (
          <>
            <div className="text-2xl font-black" style={{ color: COLORS.coral }}>{nameOf(room, I.imposterId)} נתפס/ה!</div>
            <p className="text-sm" style={{ color: COLORS.muted }}>הזדמנות אחרונה: המתחזה מנסה לנחש את המילה בטלפון שלו</p>
            <Btn variant="ghost" onClick={() => dispatch({ type: "IMP_SKIP_GUESS" })}>בלי ניחוש</Btn>
          </>
        )}
        {I.phase === "result" && (
          <>
            <div className="text-xl font-black" style={{ color: I.caught ? COLORS.emerald : COLORS.coral }}>
              {I.caught ? "המתחזה נתפס!" : "המתחזה ברח!"}
            </div>
            <div className="text-2xl font-black" style={{ color: COLORS.text }}>המתחזה: {nameOf(room, I.imposterId)}</div>
            <div className="text-lg font-bold" style={{ color: COLORS.amber }}>המילה הייתה: {I.word}</div>
            {I.caught && <div className="text-sm" style={{ color: COLORS.muted }}>{I.guess ? `המתחזה ניחש: ${I.guess} ${I.guess === I.word ? "✓" : "✗"}` : "המתחזה לא ניחש"}</div>}
            <div className="flex flex-wrap justify-center gap-2">
              {room.players.map((p) => (
                <div key={p.id} className="rounded-xl border px-3 py-1.5 text-sm font-bold" style={{ borderColor: COLORS.border, color: COLORS.text }}>
                  {p.name}: {tally[p.id]} קולות {I.gains[p.id] ? <span style={{ color: COLORS.emerald }}>+{I.gains[p.id]}</span> : null}
                </div>
              ))}
            </div>
            <Btn variant="primary" onClick={() => dispatch({ type: "IMP_NEXT" })}><RefreshCw size={18} /> סבב הבא</Btn>
          </>
        )}
      </div>
    </div>
  );
}

export function PlayerImposter({ room, dispatch, myId }) {
  const I = room.imposter;
  const [show, setShow] = useState(true);
  useEffect(() => { setShow(true); }, [I.round]);
  const me = I.imposterId === myId;
  const card = (
    <div className="rounded-3xl border-2 p-5 text-center" style={{ borderColor: me ? COLORS.coral : COLORS.emerald, background: COLORS.surface }}>
      <div className="text-xs font-bold" style={{ color: COLORS.muted }}>הקטגוריה: {I.cat}</div>
      {show ? (
        me ? (
          <div className="mt-2 text-3xl font-black" style={{ color: COLORS.coral }}>אתה המתחזה!</div>
        ) : (
          <>
            <div className="mt-2 text-xs font-bold" style={{ color: COLORS.muted }}>המילה הסודית</div>
            <div className="text-4xl font-black" style={{ color: COLORS.emerald, fontFamily: "Rubik, sans-serif" }}>{I.word}</div>
          </>
        )
      ) : (
        <div className="mt-3 text-2xl font-black" style={{ color: COLORS.muted }}>מוסתר</div>
      )}
      {me && show && <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>את/ה לא יודע/ת את המילה. הקשיבו לאחרים ונסו להישמע כאילו כן.</p>}
    </div>
  );
  const toggle = (
    <Btn full variant="ghost" onClick={() => setShow(!show)}>{show ? <><EyeOff size={18} /> הסתרה</> : <><Eye size={18} /> הצגה</>}</Btn>
  );

  if (I.phase === "reveal") {
    const seen = !!I.seen[myId];
    return (
      <div className={phoneWrap}>
        <div className="min-h-0 flex-1 content-center">{card}</div>
        {toggle}
        <Btn full variant="primary" disabled={seen} onClick={() => dispatch({ type: "IMP_SEEN", id: myId })}>{seen ? "ראיתי ✓ מחכים לשאר" : "ראיתי, אפשר להמשיך"}</Btn>
      </div>
    );
  }
  if (I.phase === "talk") {
    const pos = I.order.indexOf(myId) + 1;
    return (
      <div className={phoneWrap}>
        <div className="shrink-0 text-center text-sm font-bold" style={{ color: COLORS.amber }}>את/ה מספר {pos} בסדר הרמזים. אומרים מילה או משפט קצר, ואז דיון.</div>
        <div className="min-h-0 flex-1 content-center">{card}</div>
        {toggle}
      </div>
    );
  }
  if (I.phase === "vote") {
    const mine = I.votes[myId];
    return (
      <div className={phoneWrap}>
        <div className="shrink-0 text-center text-lg font-black" style={{ color: COLORS.text }}>מי המתחזה?</div>
        <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto">
          {room.players.filter((p) => p.id !== myId).map((p) => {
            const idx = room.players.findIndex((x) => x.id === p.id);
            return (
              <button key={p.id} onClick={() => dispatch({ type: "IMP_VOTE", id: myId, target: p.id })} className="flex items-center gap-3 rounded-2xl border p-3 text-right" style={{ borderColor: mine === p.id ? COLORS.coral : COLORS.border, background: mine === p.id ? `${COLORS.coral}22` : COLORS.surface }}>
                <Avatar index={idx} name={p.name} />
                <span className="flex-1 font-bold" style={{ color: COLORS.text }}>{p.name}</span>
                {mine === p.id && <Check size={18} color={COLORS.coral} />}
              </button>
            );
          })}
        </div>
        {mine && <p className="shrink-0 text-center text-xs" style={{ color: COLORS.emerald }}>הצבעת ✓ אפשר לשנות עד שכולם מצביעים</p>}
      </div>
    );
  }
  if (I.phase === "guess") {
    return (
      <div className={phoneWrap}>
        {me ? (
          <>
            <div className="shrink-0 text-center text-lg font-black" style={{ color: COLORS.coral }}>נתפסת! נחשו את המילה ותנצחו בכל זאת</div>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-center gap-2 overflow-y-auto">
              {I.options.map((w) => (
                <button key={w} onClick={() => dispatch({ type: "IMP_GUESS", id: myId, word: w })} className="rounded-2xl border p-3 text-base font-black" style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.text }}>{w}</button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="text-xl font-black" style={{ color: COLORS.text }}>תפסתם את המתחזה!</div>
            <p className="text-sm" style={{ color: COLORS.muted }}>הוא/היא מנסה עכשיו לנחש את המילה</p>
          </div>
        )}
      </div>
    );
  }
  // result
  const gain = I.gains[myId] || 0;
  return (
    <div className={phoneWrap}>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Trophy size={40} color={COLORS.amber} />
        <div className="text-xl font-black" style={{ color: I.caught ? COLORS.emerald : COLORS.coral }}>{I.caught ? "המתחזה נתפס!" : "המתחזה ברח!"}</div>
        <div className="text-lg font-bold" style={{ color: COLORS.text }}>המתחזה: {nameOf(room, I.imposterId)}</div>
        <div className="font-bold" style={{ color: COLORS.amber }}>המילה: {I.word}</div>
        <div className="text-2xl font-black" style={{ color: gain ? COLORS.emerald : COLORS.muted }}>{gain ? `+${gain} נקודות` : "בלי נקודות הפעם"}</div>
      </div>
    </div>
  );
}

/* ============================ BOGGLE ============================ */
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function BoardGrid({ board, size = "min(60vw, 38vh)", onTap, path = [], dim }) {
  return (
    <div className="grid shrink-0 grid-cols-4 gap-1.5" style={{ width: size, height: size, gridTemplateRows: "repeat(4, minmax(0, 1fr))" }}>
      {board.map((l, i) => {
        const on = path.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={!onTap}
            onClick={() => onTap && onTap(i)}
            className="flex min-h-0 items-center justify-center overflow-hidden rounded-xl font-black"
            style={{ background: on ? COLORS.emerald : COLORS.surfaceAlt, color: on ? "#06281d" : COLORS.text, fontSize: `calc(${size} / 6)`, fontFamily: "Rubik, sans-serif", opacity: dim ? 0.4 : 1, border: `1px solid ${COLORS.border}` }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function HostBoggle({ room, dispatch, onBack }) {
  const B = room.boggle;
  const idx = boggleIndex(B);
    const gains = boggleScores(B);
  return (
    <div className={hostWrap}>
      <TopBar
        title={`בוגל בעברית, סבב ${B.round}`}
        onBack={onBack}
        right={B.phase === "play" ? fmt(B.timeLeft) : ""}
        helpTitle="איך משחקים בבוגל"
        helpSteps={[
          "בלוח 16 אותיות. בטלפון מקישים על אותיות סמוכות (גם באלכסון), בלי להשתמש באותה משבצת פעמיים, כדי ליצור מילה של 3 אותיות לפחות.",
          "יש 3 דקות. מילה שמצאו שני שחקנים או יותר נמחקת לכולם.",
          "בסוף המנחה עובר על המילים ויכול למחוק מילה מפוקפקת בלחיצה עליה.",
          "ניקוד: 3-4 אותיות נקודה, 5 שתיים, 6 שלוש, 7 חמש, 8 ומעלה 11.",
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
        {B.phase === "ready" && (
          <>
            <div className="text-2xl font-black" style={{ color: COLORS.text }}>מוכנים? 3 דקות</div>
            <p className="text-sm" style={{ color: COLORS.muted }}>הלוח יופיע בטלפונים ובמסך הזה בלחיצה. מילים של 3 אותיות לפחות.</p>
            <Btn variant="primary" onClick={() => dispatch({ type: "BOG_BEGIN" })}><Play size={18} /> התחלה</Btn>
          </>
        )}
        {B.phase === "play" && (
          <>
            <BoardGrid board={B.board} />
            <div className="flex flex-wrap justify-center gap-1.5">
              {room.players.map((p) => (
                <div key={p.id} className="rounded-lg border px-2 py-0.5 text-xs font-bold" style={{ borderColor: COLORS.border, color: COLORS.text }}>{p.name}: {(B.words[p.id] || []).length}</div>
              ))}
            </div>
            <Btn variant="ghost" onClick={() => dispatch({ type: "BOG_END" })}>סיום מוקדם</Btn>
          </>
        )}
        {B.phase === "review" && (
          <>
            <div className="shrink-0 text-lg font-black" style={{ color: COLORS.text }}>עוברים על המילים</div>
            <p className="shrink-0 text-xs" style={{ color: COLORS.muted }}>לכל שחקן יש עמודה עם המילים שלו. מילה כפולה נמחקת אוטומטית. מילה מפוקפקת? לחצו עליה כדי למחוק אותה (ושוב כדי להחזיר).</p>
            <div className="grid min-h-0 w-full flex-1 auto-cols-fr grid-flow-col gap-2 overflow-auto">
              {room.players.map((p) => (
                <div key={p.id} className="flex min-h-0 min-w-[6.5rem] flex-col gap-1 overflow-y-auto rounded-xl border p-1.5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
                  <div className="shrink-0 text-center text-xs font-black" style={{ color: COLORS.amber }}>{p.name} ({gains[p.id] || 0})</div>
                  {[...(B.words[p.id] || [])].sort((a, b) => [...b].length - [...a].length || a.localeCompare(b, "he")).map((w) => {
                    const shared = idx[w].length > 1;
                    const removed = B.removed.includes(w);
                    const dead = shared || removed;
                    return (
                      <button key={w} disabled={shared} onClick={() => dispatch({ type: "BOG_TOGGLE", word: w })} className="rounded-lg border px-2 py-0.5 text-sm font-bold" style={{ borderColor: removed ? COLORS.coral : COLORS.border, color: dead ? COLORS.muted : COLORS.text, textDecoration: dead ? "line-through" : "none" }}>
                        {w} {shared && <span className="text-[10px]">כפול</span>}
                      </button>
                    );
                  })}
                  {(B.words[p.id] || []).length === 0 && <span className="text-center text-[11px]" style={{ color: COLORS.muted }}>אין מילים</span>}
                </div>
              ))}
            </div>
            <Btn variant="primary" onClick={() => dispatch({ type: "BOG_FINISH" })}><Trophy size={18} /> סיום וחישוב ניקוד</Btn>
          </>
        )}
        {B.phase === "result" && (
          <>
            <Trophy size={36} color={COLORS.amber} />
            <div className="text-xl font-black" style={{ color: COLORS.text }}>תוצאות הסבב</div>
            <div className="flex flex-wrap justify-center gap-2">
              {[...room.players].sort((a, b) => (B.gains[b.id] || 0) - (B.gains[a.id] || 0)).map((p) => (
                <div key={p.id} className="rounded-xl border px-3 py-1.5 text-sm font-bold" style={{ borderColor: COLORS.border, color: COLORS.text }}>{p.name} <span style={{ color: COLORS.emerald }}>+{B.gains[p.id] || 0}</span></div>
              ))}
            </div>
            <Btn variant="primary" onClick={() => dispatch({ type: "BOG_NEXT" })}><RefreshCw size={18} /> סבב נוסף</Btn>
          </>
        )}
      </div>
    </div>
  );
}

const adjacent = (a, b) => a !== b && Math.abs((a % 4) - (b % 4)) <= 1 && Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) <= 1;

export function PlayerBoggle({ room, dispatch, myId }) {
  const B = room.boggle;
  const [path, setPath] = useState([]);
  const [mine, setMine] = useState(() => B.words[myId] || []);
  const [msg, setMsg] = useState("");
  useEffect(() => { setPath([]); setMine(B.words[myId] || []); setMsg(""); }, [B.round]);
  const word = path.map((i) => B.board[i]).join("");

  const tap = (i) => {
    setMsg("");
    if (path[path.length - 1] === i) setPath(path.slice(0, -1));
    else if (!path.includes(i) && (!path.length || adjacent(path[path.length - 1], i))) setPath([...path, i]);
  };
  const add = () => {
    if ([...word].length < 3) { setMsg("מילה של 3 אותיות לפחות"); return; }
    if (mine.includes(word)) { setMsg("כבר הוספת את המילה הזו"); setPath([]); return; }
    const next = [word, ...mine];
    setMine(next);
    setPath([]);
    setMsg("");
    dispatch({ type: "BOG_WORDS", id: myId, words: next });
  };

  if (B.phase === "ready") {
    return (
      <div className={phoneWrap}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <div className="text-xl font-black" style={{ color: COLORS.text }}>בוגל בעברית</div>
          <p className="text-sm" style={{ color: COLORS.muted }}>ממתינים שהמנחה יתחיל. מקישים על אותיות סמוכות כדי ליצור מילים.</p>
        </div>
      </div>
    );
  }
  if (B.phase === "play") {
    return (
      <div className={phoneWrap}>
        <div className="flex shrink-0 items-center justify-between">
          <div className="text-2xl font-black" style={{ color: B.timeLeft <= 15 ? COLORS.coral : COLORS.amber }}>{fmt(B.timeLeft)}</div>
          <div className="text-sm font-bold" style={{ color: COLORS.muted }}>{mine.length} מילים</div>
        </div>
        <div className="flex shrink-0 justify-center"><BoardGrid board={B.board} size="min(78vw, 40vh)" onTap={tap} path={path} /></div>
        <div className="flex h-10 shrink-0 items-center justify-center text-3xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>{word || <span className="text-sm font-bold" style={{ color: COLORS.muted }}>{msg || "הקישו על אותיות סמוכות"}</span>}</div>
        {word && msg && <div className="shrink-0 text-center text-xs font-bold" style={{ color: COLORS.coral }}>{msg}</div>}
        <div className="flex shrink-0 gap-2">
          <Btn full variant="ghost" onClick={() => { setPath([]); setMsg(""); }}>נקה</Btn>
          <Btn full variant="primary" disabled={!word} onClick={add}>הוסף</Btn>
        </div>
        <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1.5 overflow-y-auto">
          {mine.map((w) => <span key={w} className="rounded-lg border px-2 py-0.5 text-sm font-bold" style={{ borderColor: COLORS.border, color: COLORS.text }}>{w}</span>)}
        </div>
      </div>
    );
  }
  const idx = boggleIndex(B);
  const list = B.words[myId] || mine;
  const gain = B.phase === "result" ? B.gains[myId] || 0 : boggleScores(B)[myId] || 0;
  return (
    <div className={phoneWrap}>
      <div className="shrink-0 text-center text-lg font-black" style={{ color: COLORS.text }}>{B.phase === "result" ? "הסבב נגמר" : "המנחה עובר על המילים"}</div>
      <div className="flex min-h-0 flex-1 flex-wrap content-start justify-center gap-1.5 overflow-y-auto">
        {list.map((w) => {
          const dead = (idx[w] || []).length > 1 || B.removed.includes(w);
          return <span key={w} className="rounded-lg border px-2 py-0.5 text-sm font-bold" style={{ borderColor: COLORS.border, color: dead ? COLORS.muted : COLORS.emerald, textDecoration: dead ? "line-through" : "none" }}>{w} {dead ? "" : `+${wordPoints(w)}`}</span>;
        })}
      </div>
      <div className="shrink-0 text-center text-2xl font-black" style={{ color: COLORS.emerald }}>{gain} נקודות</div>
      <details className="shrink-0 rounded-xl border p-2" style={{ borderColor: COLORS.border }}>
        <summary className="text-center text-sm font-bold" style={{ color: COLORS.text }}>הרשימות של כולם (לערעור)</summary>
        <div className="mt-2 max-h-[30dvh] space-y-2 overflow-y-auto">
          {room.players.map((p) => (
            <div key={p.id} className="text-xs" style={{ color: COLORS.muted }}>
              <span className="font-black" style={{ color: COLORS.amber }}>{p.name}: </span>
              {(B.words[p.id] || []).map((w) => <span key={w} className="ml-1.5" style={{ textDecoration: (idx[w] || []).length > 1 || B.removed.includes(w) ? "line-through" : "none" }}>{w}</span>)}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

/* ============================ HOST REMOTE ============================ */
export function RemoteNewGame({ room, dispatch, screen, back, wrap, header, Title }) {
  if (screen === "imposter") {
    const I = room.imposter;
    return (
      <div className={wrap}>
        {header}
        <Title>המתחזה</Title>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          {I.phase === "reveal" && (<><p className="text-sm" style={{ color: COLORS.muted }}>{Object.keys(I.seen).length} מתוך {room.players.length} ראו את התפקיד</p><Btn full variant="primary" onClick={() => dispatch({ type: "IMP_TO_TALK" })}>מתחילים בלי לחכות</Btn></>)}
          {I.phase === "talk" && <Btn full variant="primary" onClick={() => dispatch({ type: "IMP_TO_VOTE" })}>עוברים להצבעה</Btn>}
          {I.phase === "vote" && (<><p className="text-sm" style={{ color: COLORS.muted }}>{Object.keys(I.votes).length} מתוך {room.players.length} הצביעו</p><Btn full variant="primary" onClick={() => dispatch({ type: "IMP_REVEAL" })}>חשפו את התוצאה</Btn></>)}
          {I.phase === "guess" && <Btn full variant="primary" onClick={() => dispatch({ type: "IMP_SKIP_GUESS" })}>בלי ניחוש</Btn>}
          {I.phase === "result" && <Btn full variant="primary" onClick={() => dispatch({ type: "IMP_NEXT" })}>סבב הבא</Btn>}
        </div>
        <Btn full variant="ghost" className="shrink-0" onClick={back}><Home size={18} /> מרכז המשחקים</Btn>
      </div>
    );
  }
  const B = room.boggle;
  return (
    <div className={wrap}>
      {header}
      <Title>בוגל בעברית</Title>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {B.phase === "ready" && <Btn full variant="primary" onClick={() => dispatch({ type: "BOG_BEGIN" })}>התחלה</Btn>}
        {B.phase === "play" && (<><div className="text-3xl font-black" style={{ color: COLORS.amber }}>{fmt(B.timeLeft)}</div><Btn full variant="ghost" onClick={() => dispatch({ type: "BOG_END" })}>סיום מוקדם</Btn></>)}
        {B.phase === "review" && (<><p className="text-sm" style={{ color: COLORS.muted }}>מילים מפוקפקות מוחקים במסך הראשי</p><Btn full variant="primary" onClick={() => dispatch({ type: "BOG_FINISH" })}>סיום וחישוב ניקוד</Btn></>)}
        {B.phase === "result" && <Btn full variant="primary" onClick={() => dispatch({ type: "BOG_NEXT" })}>סבב נוסף</Btn>}
      </div>
      <Btn full variant="ghost" className="shrink-0" onClick={back}><Home size={18} /> מרכז המשחקים</Btn>
    </div>
  );
}
