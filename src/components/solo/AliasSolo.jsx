import React, { useRef, useState } from "react";
import { COLORS } from "../../constants/theme";
import { Btn, Chip, PartyCard } from "../common/UIComponents";
import { shuffle } from "../../data/datasets";
import { ALIAS_WORDS } from "../../data/salonContent";
import { ALIAS_TARGETS, ALIAS_TIMES, aliasDelta, finishAliasTurn, flipAliasWord, newAliasTeams } from "../../game/aliasLogic";
import { beep, useTimer, useWakeLock } from "../../utils/soloHelpers";
import { BigNumber, Clock, Lead, Note, ScoreStrip, Section, SoloScreen, Stepper, TextInput } from "./SoloUI";

const COLOR = COLORS.amber;

/* Alias: teams take turns, one phone in the middle. The one explaining holds the phone. */
export default function AliasSolo({ onBack }) {
  const [stage, setStage] = useState("setup"); // setup | ready | play | review | end
  const [teams, setTeams] = useState(() => newAliasTeams(2));
  const [time, setTime] = useState(60);
  const [target, setTarget] = useState(30);
  const [penalty, setPenalty] = useState(false);
  const [turn, setTurn] = useState(0);
  const [played, setPlayed] = useState(0);
  const [word, setWord] = useState("");
  const [log, setLog] = useState([]);

  const deck = useRef([]);
  const live = useRef({ word: "", log: [], playing: false }); // what the clock needs to know when time runs out
  const timer = useTimer();
  const wake = useWakeLock();

  const draw = () => {
    if (!deck.current.length) deck.current = shuffle(ALIAS_WORDS);
    return deck.current.pop();
  };

  const setTeamCount = (delta) => {
    const n = Math.min(4, Math.max(2, teams.length + delta));
    const next = teams.slice(0, n);
    while (next.length < n) next.push({ name: `קבוצה ${next.length + 1}`, score: 0 });
    setTeams(next);
  };
  const renameTeam = (i, name) => setTeams(teams.map((t, idx) => (idx === i ? { ...t, name } : t)));

  const startGame = () => {
    setTeams(teams.map((t, i) => ({ name: (t.name || "").trim() || `קבוצה ${i + 1}`, score: 0 })));
    deck.current = shuffle(ALIAS_WORDS);
    setTurn(0);
    setPlayed(0);
    setStage("ready");
  };

  const startTurn = () => {
    const first = draw();
    live.current = { word: first, log: [], playing: true };
    setWord(first);
    setLog([]);
    setStage("play");
    wake.keep();
    timer.start(time, () => {
      // time is up: the word on screen counts as not guessed, and costs nothing
      beep();
      live.current.playing = false;
      const finalLog = [...live.current.log, { w: live.current.word, ok: false, timeout: true }];
      wake.release();
      setLog(finalLog);
      setStage("review");
    });
  };

  const mark = (ok) => {
    if (!live.current.playing) return;
    const next = draw();
    live.current = { ...live.current, word: next, log: [...live.current.log, { w: live.current.word, ok }] };
    setWord(next);
    setLog(live.current.log);
  };

  const confirmTurn = () => {
    const r = finishAliasTurn({ teams, turn, played, log, penalty, target });
    setTeams(r.teams);
    setTurn(r.turn);
    setPlayed(r.played);
    setStage(r.stage);
  };

  const newGame = () => {
    setTeams(newAliasTeams(2));
    setTurn(0);
    setPlayed(0);
    setStage("setup");
  };

  const scores = teams.map((t) => ({ value: t.score, label: t.name }));

  if (stage === "setup") {
    return (
      <SoloScreen title="אליאס" onBack={onBack}>
        <Section title="כמה קבוצות">
          <Stepper value={teams.length} onMinus={() => setTeamCount(-1)} onPlus={() => setTeamCount(1)} />
          <div className="mt-3 space-y-2">
            {teams.map((t, i) => (
              <TextInput key={i} value={t.name} onChange={(v) => renameTeam(i, v)} ariaLabel={`שם קבוצה ${i + 1}`} maxLength={20} />
            ))}
          </div>
        </Section>
        <Section title="שניות לתור">
          <div className="flex flex-wrap gap-2">
            {ALIAS_TIMES.map((v) => <Chip big key={v} label={v} color={COLOR} active={time === v} onClick={() => setTime(v)} />)}
          </div>
        </Section>
        <Section title="נקודות לניצחון">
          <div className="flex flex-wrap gap-2">
            {ALIAS_TARGETS.map((v) => <Chip big key={v} label={v} color={COLOR} active={target === v} onClick={() => setTarget(v)} />)}
          </div>
        </Section>
        <Section title="דילוג על מילה">
          <div className="flex flex-wrap gap-2">
            <Chip big label="בלי עונש" color={COLOR} active={!penalty} onClick={() => setPenalty(false)} />
            <Chip big label="מוריד נקודה" color={COLOR} active={penalty} onClick={() => setPenalty(true)} />
          </div>
        </Section>
        <div className="mt-8"><Btn full variant="gold" onClick={startGame}>מתחילים</Btn></div>
      </SoloScreen>
    );
  }

  if (stage === "ready") {
    return (
      <SoloScreen title="אליאס" onBack={onBack}>
        <ScoreStrip items={scores} now={turn} color={COLOR} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Lead color={COLOR}>התור של</Lead>
          <h2 className="text-4xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>{teams[turn].name}</h2>
          <div className="max-w-[34ch]"><Note>מי שמסביר מחזיק את הטלפון ורואה את המילה. אסור להגיד אותה, או חלק ממנה.</Note></div>
        </div>
        <Btn full variant="gold" onClick={startTurn}>מוכנים, שעון רץ</Btn>
      </SoloScreen>
    );
  }

  if (stage === "play") {
    const guessed = log.filter((x) => x.ok).length;
    return (
      <SoloScreen title="אליאס" onBack={onBack}>
        <div className="flex items-baseline justify-between">
          <Clock seconds={timer.left} />
          <div className="text-sm" style={{ color: COLORS.muted }}>נוחשו <b className="text-lg tabular-nums" style={{ color: COLORS.text }}>{guessed}</b></div>
        </div>
        <div className="flex flex-1 items-center py-6">
          <PartyCard key={word} big stampColor={COLOR} stampLabel={teams[turn].name}>{word}</PartyCard>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="success" className="!py-5 !text-xl" onClick={() => mark(true)}>נוחש</Btn>
          <Btn variant="subtle" className="!py-5 !text-xl" onClick={() => mark(false)}>דלג</Btn>
        </div>
      </SoloScreen>
    );
  }

  if (stage === "review") {
    const d = aliasDelta(log, penalty);
    return (
      <SoloScreen title="אליאס" onBack={onBack}>
        <div className="flex flex-col items-center gap-2 pt-4 text-center">
          <Lead color={COLOR}>{teams[turn].name}</Lead>
          <BigNumber color={COLOR}>{d > 0 ? "+" : ""}{d}</BigNumber>
          <Note>לחצו על מילה כדי לתקן אם טעיתם.</Note>
        </div>
        <div className="mt-5 space-y-2">
          {log.map((x, i) => (
            <button
              key={i}
              onClick={() => setLog(flipAliasWord(log, i))}
              className="flex min-h-[50px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-right"
              style={{ borderColor: x.ok ? COLORS.emerald : COLORS.border, background: "rgba(255,255,255,0.04)" }}
            >
              <span className="break-words font-semibold" style={{ color: COLORS.text, textDecoration: x.ok ? "none" : "line-through", opacity: x.ok ? 1 : 0.65 }}>{x.w}</span>
              <span className="whitespace-nowrap text-sm font-bold" style={{ color: x.ok ? COLORS.emerald : COLORS.coral }}>
                {x.ok ? "נוחש" : x.timeout ? "נגמר הזמן" : "דולג"}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-8"><Btn full variant="gold" onClick={confirmTurn}>אישור וממשיכים</Btn></div>
      </SoloScreen>
    );
  }

  // end
  const rank = teams.slice().sort((a, b) => b.score - a.score);
  return (
    <SoloScreen title="אליאס" onBack={onBack}>
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <Lead color={COLOR}>ניצחה</Lead>
        <h2 className="text-4xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>{rank[0].name}</h2>
        <Note>{rank[0].score} נקודות</Note>
      </div>
      <div className="mt-6"><ScoreStrip items={scores} color={COLOR} /></div>
      <div className="mt-8 space-y-2.5">
        <Btn full variant="gold" onClick={newGame}>משחק חדש</Btn>
        <Btn full variant="ghost" onClick={onBack}>חזרה למרכז המשחקים</Btn>
      </div>
    </SoloScreen>
  );
}
