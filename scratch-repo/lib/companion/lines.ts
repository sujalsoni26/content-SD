/* What Cache says. Plain strings, picked locally; no generated text. */

export const LINES = {
  correct: ["Correct!", "Yes. Purr.", "Nailed it.", "Right on.", "That is the one."],
  incorrect: [
    "Close one. Read the why below; a miss sticks better than a lucky guess.",
    "Not this time. The explanation is the good part.",
    "Oops. Now you will never forget it.",
    "Wrong answers are cheap here. Read why, then keep going.",
  ],
  lessonDone: [
    "Box unlocked! That is {done} of {total}.",
    "Purr-fect. {pct} of the way there.",
    "Another building block in place. {done} of {total} learned.",
    "Learned! Ask me for a quick revision question later and we will see if it stuck.",
  ],
  quizPerfect: "{score}/{total}! Flawless. I am impressed, and I am a cat.",
  quizGood: "{score}/{total}. Solid. Retake it tomorrow and watch it climb.",
  quizLow: "{score}/{total}. That is what checks are for: reread the explanations, then try again later.",
  greetNew:
    "Hi, I'm Cache! Click me for a simple explanation, a hint, quick revision or a focus timer. You can drag me anywhere.",
  greetBack: "Welcome back! Pick up where you left off?",
  focusStart: "25 minutes of focus starts now. I will study quietly next to you.",
  focusStop: "Timer stopped. Good effort.",
  focusDone: "Focus block done. Take five: stand up, stretch, look at something far away. I am timing your break.",
  breakDone: "Break over. Ready for another round?",
  meowGeneric: [
    "Mrrp! Open a lesson and I will meow about it.",
    "Purr. Every box on a diagram needs a reason. Same for every nap.",
    "Meow. Small steps, box by box, and one treat per lesson.",
    "I'm a cache: I keep the hot facts close and the cold ones on disk.",
    "Prrrt. Head scratches recharge my cache.",
  ],
  nom: ["Nom nom nom. Fish: cached.", "Nom! That hit the spot, like a warm cache.", "Crunch crunch. Thank you, human."],
  napStart: "Nap time. Wake me from the menu, or give me a pat.",
  wake: "Mrrp! I'm up. What are we learning?",
  playDone: ["Got it! Best yarn ever.", "Pounce! Yarn: defeated.", "Again? Again! (Later. I'm a cat.)"],
  homeTips: [
    "Start simple, then find what breaks. That is the whole course in one sentence.",
    "Whenever you meet a new box, ask: what problem forced this in?",
    "The database usually breaks first, because nearly every request becomes a query.",
    "Ten focused minutes beat an hour of tab-hopping. Try my focus timer.",
  ],
} as const;

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Replace {name} placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
