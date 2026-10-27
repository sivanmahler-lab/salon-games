import React, { useRef, useState } from "react";
import { COLORS } from "../../constants/theme";
import { Btn, Chip, PartyCard } from "../common/UIComponents";
import { shuffle } from "../../data/datasets";
import { WHO } from "../../data/salonContent";
import { WHO_TIMES, parsePlayers, toggleCategory, whoPool, whoTurnName } from "../../game/whoLogic";
import { beep, useTimer, useWakeLock } from "../../utils/soloHelpers";
import WhoRoom from "./WhoRoom";
import { BigNumber, Clock, Lead, Note, ScoreStrip, Section, SoloScreen, TextInput } from "./SoloUI";

const COLOR = COLORS.purple;
const CATS = Object.keys(WHO);

function ModeSection({ mode, setMode }) {
  return (
    <Section title="איך משחקים">
      <div className="flex flex-wrap gap-2">
        <Chip big label="טלפון אחד באמצע" color={COLOR} active={mode === "one"} onClick={() => setMode("one")} />
        <Chip big label="כל אחד בטלפון שלו" color={COLOR} active={mode === "multi"} onClick={() => setMode("multi")} />
      </div>
    </Section>
  );
}

/* Who am I. Either one phone in the middle (the group gives clues, one guesses), or everyone on their own phone. */
export default function WhoSolo({ onBack }) {
  const [mode, setMode] = useState("one"); // one | multi
  const [stage, setStage] = useState("setup"); // setup | ready | count | play | review
  const [cats, setCats] = useState(() => new Set(CATS));
  const [time, setTime] = useState(60);
  const [names, setNames] = useState("");
  const [players, setPlayers] = useState([]);
  const [totals, setTotals] = useState({});
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [word, setWord] = useState("");
  const [cat, setCat] = useState("");
  const [log, setLog] = useState([]);

  const deck = useRef([]);
  const live = useRef({ word: "", cat: "", log: [], playing: false });
  const timer = useTimer();
  const wake = useWakeLock();

  const draw = (c) => {
    if (!deck.current.length) deck.current = shuffle(whoPool(c));
    return deck.current.pop();
  };

  const name = whoTurnName(players, turn, round);

  const startGame = () => {
    const list = parsePlayers(names);
    setPlayers(list);
    setTotals({});
    setTurn(0);
    setRound(1);
    deck.current = shuffle(whoPool(cats));
    setStage("ready");
  };

  const countdown = () => {
    setStage("count");
    timer.start(3, startPlay);
  };

  const startPlay = () => {
    const first = draw(cats);
    live.current = { word: first.w, cat: first.c, log: [], playing: true };
    setWord(first.w);
    setCat(first.c);
    setLog([]);
    setStage("play");
    wake.keep();
    timer.start(time, () => {
      beep();
      live.current.playing = false;
      const finalLog = [...live.current.log, { w: live.current.word, ok: false }];
      wake.release();
      if (players.length) {
        const right = finalLog.filter((x) => x.ok).length;
        setTotals((t) => ({ ...t, [name]: (t[name] || 0) + right }));
      }
      setLog(finalLog);
      setStage("review");
    });
  };

  const mark = (ok) => {
    if (!live.current.playing) return;
    const next = draw(cats);
    live.current = { ...live.current, word: next.w, cat: next.c, log: [...live.current.log, { w: live.current.word, ok }] };
    setWord(next.w);
    setCat(next.c);
    setLog(live.current.log);
  };

  const nextTurn = () => {
    setTurn(turn + 1);
    setRound(round + 1);
    setStage("ready");
  };

  const changeMode = (m) => {
    setMode(m);
    setStage("setup");
  };

  if (mode === "multi") {
    return (
      <SoloScreen title="מי אני" onBack={onBack}>
        <WhoRoom modeSection={<ModeSection mode={mode} setMode={changeMode} />} />
      </SoloScreen>
    );
  }

  if (stage === "setup") {
    return (
      <SoloScreen title="מי אני" onBack={onBack}>
        <ModeSection mode={mode} setMode={changeMode} />
        <Section title="נושאים">
          <div className="flex flex-wrap gap-2">
            {CATS.map((k) => <Chip big key={k} label={k} color={COLOR} active={cats.has(k)} onClick={() => setCats(toggleCategory(cats, k))} />)}
          </div>
        </Section>
        <Section title="שניות לתור">
          <div className="flex flex-wrap gap-2">
            {WHO_TIMES.map((v) => <Chip big key={v} label={v} color={COLOR} active={time === v} onClick={() => setTime(v)} />)}
          </div>
        </Section>
        <Section title="שמות השחקנים, מופרדים בפסיק">
          <TextInput value={names} onChange={setNames} placeholder="אפשר גם בלי" ariaLabel="שמות השחקנים" />
        </Section>
        <div className="mt-8"><Btn full variant="primary" onClick={startGame}>מתחילים</Btn></div>
      </SoloScreen>
    );
  }

  if (stage === "ready") {
    return (
      <SoloScreen title="מי אני" onBack={onBack}>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Lead color={COLOR}>{players.length ? "התור של" : "מוכנים?"}</Lead>
          <h2 className="text-4xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>{name}</h2>
          <div className="max-w-[34ch]"><Note>מחזיקים את הטלפון מול הפנים, והמסך פונה אל כל השאר. הם נותנים רמזים, ומישהו מהם לוחץ נכון או דלג.</Note></div>
        </div>
        <Btn full variant="primary" onClick={countdown}>מתחילים לספור</Btn>
      </SoloScreen>
    );
  }

  if (stage === "count") {
    return (
      <SoloScreen title="מי אני" onBack={onBack}>
        <Lead color={COLOR}>{name}</Lead>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-[8rem] font-black leading-none" style={{ color: COLOR, fontFamily: "Rubik, sans-serif" }}>{timer.left || "קדימה"}</div>
        </div>
      </SoloScreen>
    );
  }

  if (stage === "play") {
    const right = log.filter((x) => x.ok).length;
    return (
      <SoloScreen title="מי אני" onBack={onBack}>
        <div className="flex items-baseline justify-between">
          <Clock seconds={timer.left} />
          <div className="text-sm" style={{ color: COLORS.muted }}>נכון <b className="text-lg tabular-nums" style={{ color: COLORS.text }}>{right}</b></div>
        </div>
        <div className="flex flex-1 items-center py-6">
          <PartyCard key={word} big stampColor={COLOR} stampLabel={cat}>{word}</PartyCard>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="success" className="!py-5 !text-xl" onClick={() => mark(true)}>נכון</Btn>
          <Btn variant="subtle" className="!py-5 !text-xl" onClick={() => mark(false)}>דלג</Btn>
        </div>
      </SoloScreen>
    );
  }

  // review
  const right = log.filter((x) => x.ok).length;
  const ranking = players.slice().sort((a, b) => (totals[b] || 0) - (totals[a] || 0));
  return (
    <SoloScreen title="מי אני" onBack={onBack}>
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <Lead color={COLOR}>{name}</Lead>
        <BigNumber color={COLOR}>{right}</BigNumber>
        <Note>{right === 1 ? "ניחוש אחד" : "ניחושים נכונים"}</Note>
      </div>
      <div className="mt-5 space-y-2">
        {log.map((x, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: x.ok ? COLORS.emerald : COLORS.border, background: "rgba(255,255,255,0.04)" }}>
            <span className="break-words font-semibold" style={{ color: COLORS.text, textDecoration: x.ok ? "none" : "line-through", opacity: x.ok ? 1 : 0.65 }}>{x.w}</span>
            <span className="whitespace-nowrap text-sm font-bold" style={{ color: x.ok ? COLORS.emerald : COLORS.coral }}>{x.ok ? "נכון" : "דולג"}</span>
          </div>
        ))}
      </div>
      {players.length > 0 && (
        <Section title="טבלה">
          <ScoreStrip items={ranking.map((p) => ({ value: totals[p] || 0, label: p }))} color={COLOR} />
        </Section>
      )}
      <div className="mt-8 space-y-2.5">
        <Btn full variant="primary" onClick={nextTurn}>התור הבא</Btn>
        <Btn full variant="ghost" onClick={onBack}>סיימנו</Btn>
      </div>
    </SoloScreen>
  );
}
