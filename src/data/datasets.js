import { TRAIT_TAGS } from "../constants/theme";
import { ALL_CHARACTERS } from "./hostCharacters";
import { ALIAS_WORDS, RULES } from "./salonContent";

/* ============================================================================
   Content datasets — fully local, no external API required.
   NOTE: "Who am I" uses real, well-known characters (famous Israelis, film and TV
   characters, animals) from salonContent.js.
============================================================================ */

const BASE_SHRINK_RULES = [
  "כל פעם שמישהו עונה, הוא חייב להשתמש במילה שמתחילה באות האחרונה של השאלה",
  "עונים על כל שאלה כאילו אתם האדם שיושב משמאלכם",
  "מדברים בגוף שלישי על עצמכם, כל הזמן",
  "כל תשובה חייבת להכיל מספר כלשהו",
  "עונים על כל שאלה בשאלה נגדית",
  "מזכירים חיה כלשהי בכל תשובה שאתם נותנים",
  "מדברים לאט פי שניים מהרגיל, בלי הסבר",
  "מסתכלים לשמיים לרגע לפני שעונים על כל שאלה",
  "מחקים את הטון של מי שדיבר/ה לפניכם",
  "לא אומרים \u2018כן\u2019 או \u2018לא\u2019 באופן ישיר, אף פעם",
  "כל פעם שצוחקים, נוגעים באף שלכם",
  "מתייחסים לכולם בתואר \u2018אדוני\u2019 או \u2018גברתי\u2019",
  "עונים על כל שאלה כאילו אתם מככבים בפרסומת",
  "כל תשובה מתחילה באות אחרת, לפי סדר האלף-בית",
  "מזכירים צבע כלשהו בכל תשובה",
  "עונים רק במשפטים של חמש מילים בדיוק",
  "מדברים כמו קריין חדשות בכל תשובה",
  "לפני כל תשובה עושים הפסקה דרמטית של שתי שניות",
  "מתייחסים לכל שאלה כאילו היא שאלה קשה מאוד",
  "עונים עם מבטא זר כלשהו, בכל תשובה",
  "מחזיקים את האצבע על הסנטר כל עוד מדברים",
  "כל תשובה חייבת לכלול שם של עיר בישראל",
  "עונים לכל מי ששואל אתכם כאילו הוא אדם מפורסם",
  "מדברים בצורה מנומסת ורשמית מדי, כמו בישיבת הנהלה",
  "כל תשובה כוללת השוואה לאוכל כלשהו",
  "מצטטים שורה משיר מוכר בכל תשובה",
  "מדברים בקצב מהיר מאוד, בלי נשימה",
  "עונים על כל שאלה בשאלה אחת על השואל",
  "אומרים את הדבר ההפוך ממה שחושבים, בכל תשובה",
  "מדברים כאילו אתם ממש עייפים, מפהקים באמצע",
  "מתייחסים לשואל כאילו הוא מומחה שאתם מתרשמים ממנו מאוד",
  "מספרים בכל תשובה זיכרון קצר מהילדות",
  "מדברים בקול נמוך מאוד, כמו מנחה של תוכנית לילה",
  "מחליפים כל פעם שמזכירים את המילה \u2018אני\u2019 ל\u2018האדם הזה\u2019",
  "מדברים על כל דבר כאילו זה ממש חדשות מרעישות",
  "עונים על כל שאלה כאילו אתם מחפשים את המילה הנכונה ולא מוצאים אותה",
];

// All the secret rules: the ones above plus the ones from the one-phone game.
// Two one-phone rules say the same as rules above, so they are left out here.
const DUPLICATE_RULES = new Set([
  "כל תשובה חייבת לכלול צבע.",
  "כל אחד עונה על האדם שיושב משמאלו, כאילו הוא עצמו.",
]);
export const GENERIC_SHRINK_RULES = [...BASE_SHRINK_RULES, ...RULES.filter((r) => !DUPLICATE_RULES.has(r))];

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

// "Who am I" in the hosted game: well-known people and characters (singers, politicians, athletes,
// actors, broadcasters, cartoon characters), from Israel and abroad, in random order.
export function buildCharacters() {
  return shuffle(ALL_CHARACTERS);
}

// One secret rule that everyone but the psychologist follows.
export function buildShrinkRule() {
  return shuffle([...GENERIC_SHRINK_RULES])[0];
}

// Alias deck: only words (no personal cards), all of them in random order.
export function buildAliasDeck() {
  return shuffle([...new Set([...ALIAS_WORDS, ...ALIAS_GENERAL_WORDS])]);
}
