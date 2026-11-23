// Base-62 encoding for the url-shortener widget, plus a reversible scramble so codes do not reveal their neighbours.

export const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/** 62⁷: the scramble works inside the 7-character space. */
export const SPACE_7 = 62 ** 7;
/** A prime coprime with 62, so multiplying by it is a bijection mod 62⁷. */
const MULTIPLIER = 2147483647;
const OFFSET = 1234567890123 % SPACE_7;
/** Largest ID the inputs accept (15 digits stays inside Number.MAX_SAFE_INTEGER). */
export const MAX_ID = 999999999999999;

export function encode(n: number): string {
  if (n === 0) return "0";
  let s = "";
  let x = n;
  while (x > 0) {
    s = ALPHABET[x % 62] + s;
    x = Math.floor(x / 62);
  }
  return s;
}

/** NaN for an invalid character, Infinity when the value passes MAX_ID. */
export function decode(code: string): number {
  let n = 0;
  for (const ch of code) {
    const d = ALPHABET.indexOf(ch);
    if (d < 0) return NaN;
    n = n * 62 + d;
    if (n > MAX_ID) return Infinity;
  }
  return n;
}

export interface DivisionStep {
  value: number;
  quotient: number;
  remainder: number;
  char: string;
}

/** Repeated division by 62; the remainders, read bottom-up, are the code. */
export function divisionSteps(n: number): DivisionStep[] {
  if (n === 0) return [{ value: 0, quotient: 0, remainder: 0, char: "0" }];
  const steps: DivisionStep[] = [];
  let x = n;
  while (x > 0) {
    const quotient = Math.floor(x / 62);
    const remainder = x % 62;
    steps.push({ value: x, quotient, remainder, char: ALPHABET[remainder] });
    x = quotient;
  }
  return steps;
}

/** (a × b) mod m without overflowing doubles (all values stay below 2 × 62⁷). */
function mulmod(a: number, b: number, m: number): number {
  let r = 0;
  let x = a % m;
  let y = b;
  while (y > 0) {
    if (y % 2 === 1) r = (r + x) % m;
    x = (x * 2) % m;
    y = Math.floor(y / 2);
  }
  return r;
}

/** Reversible permutation of 0 … 62⁷ − 1, encoded as a fixed 7-character code. */
export function scrambledCode(id: number): string {
  const v = (mulmod(id % SPACE_7, MULTIPLIER, SPACE_7) + OFFSET) % SPACE_7;
  return encode(v).padStart(7, "0");
}

export interface CapacityRow {
  length: number;
  codes: number;
  words: string;
  /** Days of codes at 100M new URLs a day. */
  daysAt100M: number;
}

function words(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} trillion`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} billion`;
  return `${Math.round(n / 1e6)} million`;
}

export const CAPACITY: CapacityRow[] = [5, 6, 7].map((length) => {
  const codes = 62 ** length;
  return { length, codes, words: words(codes), daysAt100M: codes / 1e8 };
});

export function lifetime(days: number): string {
  if (days < 60) return `${Math.round(days)} days`;
  const years = days / 365;
  return `${years < 10 ? years.toFixed(1) : Math.round(years)} years`;
}
