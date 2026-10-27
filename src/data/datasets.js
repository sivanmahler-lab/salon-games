import { TRAIT_TAGS } from "../constants/theme";
import { WHO } from "./salonContent";

/* ============================================================================
   Content datasets — fully local, no external API required.
   NOTE: "Who am I" uses real, well-known characters (famous Israelis, film and TV
   characters, animals) from salonContent.js.
============================================================================ */

export const GENERIC_SHRINK_RULES = [
  "כל פעם שמישהו עונה, הוא חייב להשתמש במילה שמתחילה באות האחרונה של השאלה",
  "עונים על כל שאלה כאילו אתם האדם שיושב משמאלכם",
  "לפני כל משפט אומרים \u2018כפי שכולם יודעים\u2019",
  "מדברים בגוף שלישי על עצמכם, כל הזמן",
  "כל תשובה חייבת להכיל מספר כלשהו",
  "עונים על כל שאלה בשאלה נגדית",
  "מסיימים כל משפט במילה \u2018בערך\u2019",
  "לוחצים יד לכל מי שמדבר איתכם, כל פעם מחדש",
  "מזכירים חיה כלשהי בכל תשובה שאתם נותנים",
  "מדברים לאט פי שניים מהרגיל, בלי הסבר",
  "מתחילים כל משפט במילה \u2018טכנית\u2019",
  "מסתכלים לשמיים לרגע לפני שעונים על כל שאלה",
  "כל תשובה חייבת לכלול את המילה \u2018בעצם\u2019",
  "מחקים את הטון של מי שדיבר/ה לפניכם",
  "עונים בלחישה על כל שאלה שקשורה לכסף",
  "מוסיפים \u2018אם תשאלו אותי\u2019 לפני כל דעה שלכם",
  "לא אומרים \u2018כן\u2019 או \u2018לא\u2019 באופן ישיר, אף פעם",
  "כל פעם שצוחקים, נוגעים באף שלכם",
  "מתייחסים לכולם בתואר \u2018אדוני\u2019 או \u2018גברתי\u2019",
  "עונים על כל שאלה עם ציטוט מומצא בשם \u2018חכם עתיק\u2019",
];

export const PERSONALIZED_SHRINK_TEMPLATES = [
  "בכל תשובה תשלב/י את המילה \u2018{tag}\u2019",
  "תחקה/י את ה{trait} של עצמך בכל פעם שמישהו צוחק",
  "תדבר/י כאילו אתה/את {name} האמיתי/ת, בלי לחשוף את זה",
  "תתייחס/י לכל שאלה כאילו היא על {tag}",
  "תזכיר/י את ה{trait} שלך לפחות פעם בכל תשובה",
  "תענה/י על כל שאלה כאילו אתה/את {name}",
  "תדבר/י על {tag} גם כשלא שואלים על זה בכלל",
  "כל תשובה שלך צריכה להישמע כמו שבעל/ת ה{trait} היה/הייתה עונה",
  "תסיים/י כל משפט בהתייחסות כלשהי ל{tag}",
  "תתנהג/י כאילו יש לך את ה{trait} של {name}",
];

export const ALIAS_GENERAL_WORDS = [
  "פיצה", "ים", "חתונה", "נדנדה", "מדינה", "גיטרה", "מטריה", "שוקולד", "רכבת", "חלום",
  "מראה", "גשר", "דבש", "כרטיס", "מנורה", "שיר", "מסיבה", "ננס", "פינגווין", "קרקס",
  "מפתח", "שמיכה", "טרמפ", "גלידה", "חוף", "תרמיל", "שעון", "מגדלור", "דייג", "קסם",
  "בלון", "מדורה", "עוגה", "צלצול", "מצפן", "יומן", "שקיעה", "תור", "חידה", "מצלמה",
];

export const ALIAS_PERSONAL_TEMPLATES = [
  "ה{trait} המפורסם של {name}",
  "המילה שתמיד יוצאת מהפה של {name}",
  "הרגע שבו {name} כמעט הביך/ה את כולם",
  "{name} כשמעירים אותו/ה משינה",
  "הכינוי הסודי שיש ל{name}",
  "היום ש{name} ניסה/תה להיות מגניב/ה מדי",
];

/* ------------------------------ generation engine ------------------------------ */

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

function randomTrait(player) {
  if (player?.traits?.length) return player.traits[Math.floor(Math.random() * player.traits.length)];
  return null;
}

export function fillTemplate(tpl, player, extra = {}) {
  const trait = randomTrait(player);
  return tpl
    .replace(/{name}/g, player?.name?.trim() || "מישהו כאן")
    .replace(/{trait}/g, trait || "התכונה המסתורית שלו/ה")
    .replace(/{tag}/g, extra.tag || pick(TRAIT_TAGS, 1)[0]);
}

// Filters templates to ones a player's actual data can support, falling back
// to a safe pool so generation never breaks when traits weren't picked.
export function fieldAwarePool(templates, player, safePool) {
  const hasTrait = !!player?.traits?.length;
  const usable = templates.filter((t) => !t.includes("{trait}") || hasTrait);
  if (usable.length >= 3 || !safePool) return usable.length ? usable : templates;
  return shuffle([...usable, ...safePool]);
}

// "Who am I": real, recognizable characters (famous Israelis, film and TV characters, animals), in random order.
// Foods, places and professions are left out here: they are not characters someone can "be".
export const CHARACTER_TOPICS = ["ישראלים מפורסמים", "דמויות מסרטים וסדרות", "חיות"];

export function buildCharacters() {
  return shuffle(CHARACTER_TOPICS.flatMap((topic) => WHO[topic]));
}

export function buildShrinkPool(players) {
  return players.map((p) => {
    const personalPool = fieldAwarePool(PERSONALIZED_SHRINK_TEMPLATES, p, []);
    const combined = shuffle([...GENERIC_SHRINK_RULES, ...personalPool]);
    const tag = pick(TRAIT_TAGS, 1)[0];
    return { player: p, rule: fillTemplate(combined[0], p, { tag }) };
  });
}

export function buildAliasDeck(players) {
  const personal = players.flatMap((p) => pick(fieldAwarePool(ALIAS_PERSONAL_TEMPLATES, p, []), 1).map((t) => fillTemplate(t, p)));
  const generalCount = Math.max(24, personal.length * 2);
  const general = pick(ALIAS_GENERAL_WORDS, generalCount);
  return shuffle([...personal, ...general]);
}
