import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { COLORS } from "../../constants/theme";

/* "How to play": what the evening is, and the rules of each game, for people who have never played. */

const INTRO = [
  "משחקי סלון הם משחקי חברה לערב עם חברים, בלי קלפים ובלי לוח.",
  "אפשר להציג את המסך הראשי בשתי דרכים: לפתוח את האתר בדפדפן של הטלוויזיה החכמה, או לפתוח אותו במחשב או בטלפון ולשקף (Mirroring) לטלוויזיה. כל השחקנים מצטרפים מהטלפונים שלהם: סורקים את הברקוד (QR) שעל המסך הראשי, או מקלידים את קוד החדר ואת השם.",
  "המנחה לוחץ על הכפתורים: התחלת תור, \"הצליח/ה\" ו\"דלג\", הפסקה והמשך. הכי נוח לעשות את זה מהטלפון: מצטרפים כשחקן רגיל ולוחצים על הכפתור הקטן \"שלט מנחה\" בפינת המסך. הטלפון הופך לשלט שמפעיל את המסך הראשי, ואפשר לחזור למסך האישי בלחיצה על \"חזרה למסך שלי\". אפשר גם ללחוץ ישירות על המסך הראשי, ובדפדפן של טלוויזיה משתמשים בשלט כמו בעכבר.",
  "המסך הראשי לא מראה את הדמויות, המילים והכללים הסודיים של המשחקים. הם מופיעים רק בטלפונים של מי שצריך לראות אותם, ולכן כולם יכולים להסתכל על המסך הראשי בלי לקלקל את המשחק. גם השלט בטלפון לא מראה אותם, אז המנחה ממשיך לשחק כמו כולם.",
  "אין צורך להתקין שום דבר. צריך 3 שחקנים לפחות. הסודות מופיעים רק בטלפונים של מי שצריך לראות אותם.",
  "אם אין טלוויזיה, בוחרים \"טלפון אחד לכולם\" ומעבירים טלפון אחד בין השחקנים. אז אין מסך ראשי, ולכן כל מי שמסתכל על הטלפון רואה את מה שמוצג בו.",
];

const GAMES = [
  {
    title: "מי אני?",
    color: COLORS.purple,
    goal: "לנחש את הדמות המפורסמת שמוצגת לכולם חוץ ממך.",
    steps: [
      "בכל תור שחקן אחד הוא המנחש. הטלפון שלו לא מראה את הדמות.",
      "שאר השחקנים רואים את הדמות בטלפון שלהם (זמר, פוליטיקאי, ספורטאי, דמות מצוירת ועוד).",
      "הם מתארים אותה במילים, בלי להגיד את השם, והמנחש עונה בקול.",
      "כשהמנחש צדק, המנחה לוחץ \"הצליח/ה!\" במסך המנחה. אם מתקעים, לוחצים \"דלג\" ועוברים לדמות הבאה.",
      "יש 60 שניות לתור. כל ניחוש נכון שווה נקודה. אחר כך התור עובר לשחקן הבא, עם דמות חדשה.",
    ],
  },
  {
    title: "הפסיכולוג",
    color: COLORS.emerald,
    goal: "לגלות איזה כלל סודי כולם מקיימים.",
    steps: [
      "המנחה בוחר מי הפסיכולוג. בטלפון שלו כתוב שעליו לגלות את הכלל, והוא לא רואה אותו.",
      "כל שאר השחקנים מקבלים בטלפון את אותו כלל סודי, למשל \"מסיימים כל משפט במילה בערך\".",
      "הפסיכולוג שואל שאלות את מי שהוא רוצה, והשחקנים עונים לפי הכלל, בלי לגלות אותו.",
      "אם הוא תקוע, הוא לוחץ \"רמז\" (זה מוריד נקודה). כשהוא חושב שהבין, הוא לוחץ \"גיליתי את הכלל\".",
      "אם גילה: 3 נקודות פחות נקודה על כל רמז (לפחות נקודה אחת). בסוף מראים מה היה הכלל.",
    ],
  },
  {
    title: "אליאס סלון",
    color: COLORS.amber,
    goal: "להסביר מילה כדי שהאחרים ינחשו אותה.",
    steps: [
      "בכל תור שחקן אחד הוא המסביר. רק בטלפון שלו מופיעה מילה.",
      "הוא מסביר אותה בעל פה, בלי להגיד אותה, ושאר השחקנים צועקים ניחושים.",
      "כשניחשו נכון הוא לוחץ \"נכון\" (או מחליק ימינה) ומקבל מילה חדשה. אם אין מושג, \"דלג\" (או החלקה שמאלה).",
      "יש 60 שניות לתור. כל מילה שנוחשה נכון שווה נקודה.",
    ],
  },
];

function Section({ title, color, open, onToggle, children }) {
  return (
    <div className="rounded-2xl border" style={{ borderColor: open ? color : COLORS.border, background: COLORS.surface }}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-right">
        <span className="flex-1 text-base font-black" style={{ color: COLORS.text }}>{title}</span>
        <ChevronDown size={18} color={COLORS.muted} style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && <div className="space-y-2 px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function HowToPlay({ onClose }) {
  const [open, setOpen] = useState("intro");
  const toggle = (k) => setOpen(open === k ? null : k);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: COLORS.bg }} dir="rtl" role="dialog" aria-label="הוראות משחק">
      <div className="mx-auto max-w-md px-5 pb-10 pt-5 md:max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black" style={{ color: COLORS.text, fontFamily: "Rubik, sans-serif" }}>איך משחקים?</h2>
          <button onClick={onClose} aria-label="סגירה" className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: COLORS.surfaceAlt, color: COLORS.text }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <Section title="מה זה ואיך מתחילים" color={COLORS.purple} open={open === "intro"} onToggle={() => toggle("intro")}>
            {INTRO.map((t) => <p key={t} className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>{t}</p>)}
          </Section>
          {GAMES.map((g) => (
            <Section key={g.title} title={g.title} color={g.color} open={open === g.title} onToggle={() => toggle(g.title)}>
              <p className="text-sm font-bold" style={{ color: g.color }}>המטרה: {g.goal}</p>
              <ol className="list-decimal space-y-1.5 pr-5 text-sm leading-relaxed" style={{ color: COLORS.muted }}>
                {g.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </Section>
          ))}
        </div>

        <button onClick={onClose} className="mt-6 w-full rounded-2xl py-3.5 text-base font-black" style={{ background: COLORS.purple, color: "#fff" }}>הבנתי, אפשר להתחיל</button>
      </div>
    </div>
  );
}
