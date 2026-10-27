/* The Psychologist, one phone in the middle of the room. Pure rules, no screens. */

import { RULES, QUESTIONS } from "../data/salonContent";
import { shuffle } from "../data/datasets";

// Rules come out of a shuffled deck, so none repeats until all 20 have been used.
export function drawRule(deck) {
  const d = deck.length ? deck.slice() : shuffle(RULES);
  const rule = d.pop();
  return { rule, deck: d };
}

export function sampleQuestions() {
  return shuffle(QUESTIONS).slice(0, 3);
}
