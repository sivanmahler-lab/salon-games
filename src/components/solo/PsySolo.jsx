import React, { useState } from "react";
import { COLORS } from "../../constants/theme";
import { Btn, PartyCard } from "../common/UIComponents";
import { drawRule, sampleQuestions } from "../../game/psyLogic";
import { Lead, Note, Section, SoloScreen, Stepper } from "./SoloUI";

const COLOR = COLORS.emerald;

// The deck of rules lives for the whole visit, so a rule does not come back until all 20 have been used.
let ruleDeck = [];

const STEPS = [
  "מי שמשחק את הפסיכולוג יוצא מהחדר.",
  "מי שנשארו מגלים כאן חוק סודי.",
  "הפסיכולוג חוזר ושואל שאלות. כל אחד עונה לפי החוק.",
  "הפסיכולוג מנחש מה החוק. אם הצליח, מחליפים תפקידים.",
];

/* The Psychologist: one leaves the room, the rest agree on a secret rule, and the psychologist works it out from the answers. */
export default function PsySolo({ onBack }) {
  const [stage, setStage] = useState("intro"); // intro | ask | rule | hidden | play | reveal
  const [rule, setRule] = useState("");
  const [questions, setQuestions] = useState([]);
  const [asked, setAsked] = useState(0);

  const newRule = () => {
    const r = drawRule(ruleDeck);
    ruleDeck = r.deck;
    setRule(r.rule);
  };

  if (stage === "intro") {
    return (
      <SoloScreen title="הפסיכולוג" onBack={onBack}>
        <Section title="איך משחקים">
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px]" style={{ color: COLORS.text }}>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ background: `${COLOR}33`, color: COLOR }}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>
        <div className="mt-8"><Btn full variant="success" onClick={() => setStage("ask")}>מוכנים, מישהו יוצא</Btn></div>
      </SoloScreen>
    );
  }

  if (stage === "ask") {
    return (
      <SoloScreen title="הפסיכולוג" onBack={onBack} center>
        <Lead color={COLOR}>לפני שממשיכים</Lead>
        <h2 className="text-3xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>הפסיכולוג מחוץ לחדר?</h2>
        <div className="max-w-[34ch]"><Note>שהוא לא יציץ. החוק יופיע במסך הבא.</Note></div>
        <div className="mt-6 w-full">
          <Btn full variant="success" onClick={() => { newRule(); setStage("rule"); }}>הצג את החוק</Btn>
        </div>
      </SoloScreen>
    );
  }

  if (stage === "rule") {
    return (
      <SoloScreen title="הפסיכולוג" onBack={onBack}>
        <div className="flex flex-1 items-center py-6">
          <PartyCard key={rule} big stampColor={COLOR} stampLabel="החוק של הסיבוב">{rule}</PartyCard>
        </div>
        <div className="space-y-2.5">
          <Btn full variant="success" onClick={() => setStage("hidden")}>הבנו, מסתירים</Btn>
          <Btn full variant="ghost" onClick={newRule}>חוק אחר</Btn>
        </div>
      </SoloScreen>
    );
  }

  if (stage === "hidden") {
    return (
      <SoloScreen title="הפסיכולוג" onBack={onBack} center>
        <Lead color={COLOR}>החוק מוסתר</Lead>
        <h2 className="text-3xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>קוראים לפסיכולוג</h2>
        <div className="max-w-[34ch]"><Note>כולם זוכרים את החוק? אפשר להמשיך.</Note></div>
        <div className="mt-6 w-full">
          <Btn full variant="success" onClick={() => { setAsked(0); setQuestions(sampleQuestions()); setStage("play"); }}>הפסיכולוג חזר</Btn>
        </div>
      </SoloScreen>
    );
  }

  if (stage === "play") {
    return (
      <SoloScreen title="הפסיכולוג" onBack={onBack}>
        <Section title="שאלות לדוגמה">
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q} className="rounded-2xl border px-4 py-3" style={{ borderColor: COLORS.border, background: "rgba(255,255,255,0.04)", color: COLORS.text }}>{q}</li>
            ))}
          </ul>
          <div className="mt-3"><Btn full variant="ghost" onClick={() => setQuestions(sampleQuestions())}>שאלות אחרות</Btn></div>
        </Section>
        <Section title="שאלות שנשאלו">
          <Stepper value={asked} onMinus={() => setAsked(Math.max(0, asked - 1))} onPlus={() => setAsked(asked + 1)} />
        </Section>
        <div className="mt-8"><Btn full variant="success" onClick={() => setStage("reveal")}>חושפים את החוק</Btn></div>
      </SoloScreen>
    );
  }

  // reveal
  return (
    <SoloScreen title="הפסיכולוג" onBack={onBack}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6">
        <PartyCard key={rule} big stampColor={COLOR} stampLabel="החוק היה">{rule}</PartyCard>
        {asked > 0 && <Note>הפסיכולוג שאל {asked} שאלות.</Note>}
      </div>
      <div className="space-y-2.5">
        <Btn full variant="success" onClick={() => setStage("ask")}>סיבוב חדש</Btn>
        <Btn full variant="ghost" onClick={onBack}>חזרה למרכז המשחקים</Btn>
      </div>
    </SoloScreen>
  );
}
