// Back-of-the-envelope maths for the estimator widget: parsing, formatting, the formulas and the system shape.

export type FieldKey = "dau" | "writes" | "ratio" | "size" | "retention" | "replication" | "peak" | "perServer";
type FieldKind = "count" | "number" | "bytes";

export interface FieldSpec {
  key: FieldKey;
  label: string;
  kind: FieldKind;
  hint: string;
}

export const FIELDS: readonly FieldSpec[] = [
  { key: "dau", label: "Daily active users", kind: "count", hint: "e.g. 100M, 1B" },
  { key: "writes", label: "Writes per user per day", kind: "number", hint: "posts, uploads, messages" },
  { key: "ratio", label: "Reads per write", kind: "number", hint: "the reads:writes ratio" },
  { key: "size", label: "Size per write", kind: "bytes", hint: "e.g. 1KB, 500KB" },
  { key: "retention", label: "Retention (days)", kind: "number", hint: "3650 = 10 years" },
  { key: "replication", label: "Replication factor", kind: "number", hint: "usually 3" },
  { key: "peak", label: "Peak factor", kind: "number", hint: "2–3×; 5–10× for spikes" },
  { key: "perServer", label: "QPS per app server", kind: "count", hint: "about 1k" },
];

export type Inputs = Record<FieldKey, string>;
export type Values = Record<FieldKey, number>;
export type PresetId = "url" | "drive" | "chat";

export interface Preset {
  label: string;
  about: string;
  inputs: Inputs;
}

export const PRESETS: Record<PresetId, Preset> = {
  url: {
    label: "URL shortener",
    about: "100M new URLs a day, reads:writes = 100:1, kept 10 years, about 500 B per record rounded up to 1 KB.",
    inputs: { dau: "100M", writes: "1", ratio: "100", size: "1KB", retention: "3650", replication: "3", peak: "3", perServer: "1k" },
  },
  drive: {
    label: "Google Drive",
    about: "50M daily users, 2 uploads each a day, a 500 KB average file, reads:writes = 1:1, kept one year.",
    inputs: { dau: "50M", writes: "2", ratio: "1", size: "500KB", retention: "365", replication: "3", peak: "3", perServer: "1k" },
  },
  chat: {
    label: "Chat app drill",
    about: "100 billion messages a day (modelled as 1B users × 100), 100 B each, reads:writes = 1:1, kept 30 days.",
    inputs: { dau: "1B", writes: "100", ratio: "1", size: "100B", retention: "30", replication: "3", peak: "3", perServer: "1k" },
  },
};

export function isPresetId(v: string | undefined): v is PresetId {
  return v === "url" || v === "drive" || v === "chat";
}

/* ---------------- parsing ---------------- */

const COUNT_SUFFIX: Record<string, number> = { "": 1, k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
const BYTE_SUFFIX: Record<string, number> = { "": 1, b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12 };

function parse(raw: string, kind: FieldKind): number {
  const s = raw.trim().replace(/[,\s_]/g, "").toLowerCase();
  const m = /^(\d+(?:\.\d+)?)([a-z]*)$/.exec(s);
  if (!m) return NaN;
  const table = kind === "bytes" ? BYTE_SUFFIX : kind === "count" ? COUNT_SUFFIX : { "": 1 };
  const mult = (table as Record<string, number>)[m[2]];
  return mult === undefined ? NaN : Number(m[1]) * mult;
}

export interface Parsed {
  values: Values | null;
  invalid: FieldKey[];
}

export function parseInputs(inputs: Inputs): Parsed {
  const values = {} as Values;
  const invalid: FieldKey[] = [];
  for (const f of FIELDS) {
    const v = parse(inputs[f.key], f.kind);
    if (!Number.isFinite(v) || v <= 0) invalid.push(f.key);
    values[f.key] = v;
  }
  return { values: invalid.length ? null : values, invalid };
}

export const FIELD_HELP: Record<FieldKind, string> = {
  count: "Use a plain number or k, M, B, T (for example 100M).",
  number: "Use a plain positive number.",
  bytes: "Use a size such as 100B, 1KB, 500KB or 2MB.",
};

/* ---------------- formatting ---------------- */

/** Round to `digits` significant figures and group thousands. */
export function num(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  return Number(n.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function scaled(n: number, units: ReadonlyArray<readonly [string, number]>, digits: number, sep: string, base: string): string {
  if (!Number.isFinite(n)) return "—";
  for (const [unit, size] of units) {
    if (Math.abs(n) >= size * 0.9995) return `${num(n / size, digits)}${sep}${unit}`;
  }
  return `${num(n, digits)}${base}`;
}

const SI = [["T", 1e12], ["B", 1e9], ["M", 1e6], ["k", 1e3]] as const;
const BYTES = [["EB", 1e18], ["PB", 1e15], ["TB", 1e12], ["GB", 1e9], ["MB", 1e6], ["KB", 1e3]] as const;
const BITS = [["Tbps", 1e12], ["Gbps", 1e9], ["Mbps", 1e6], ["kbps", 1e3]] as const;

export const fmtSI = (n: number) => scaled(n, SI, 3, "", "");
/** Sizes are estimates: two significant figures read honestly (1.1 PB, 55 PB). */
export const fmtBytes = (n: number) => scaled(n, BYTES, 2, " ", " B");
export const fmtBits = (bytesPerSecond: number) => scaled(bytesPerSecond * 8, BITS, 2, " ", " bps");

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
export function sup(n: number): string {
  return String(n)
    .split("")
    .map((c) => SUP[c] ?? c)
    .join("");
}

/** Scientific notation for working: 10⁸, 5 × 10⁷. */
export function sci(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) < 1e4) return num(n);
  let e = Math.floor(Math.log10(n));
  let m = Number((n / 10 ** e).toPrecision(3));
  if (m >= 10) {
    m /= 10;
    e += 1;
  }
  return `${m === 1 ? "" : `${num(m)} × `}10${sup(e)}`;
}

/* ---------------- the estimate ---------------- */

export type OutputId =
  | "writesPerDay"
  | "writeQps"
  | "readQps"
  | "totalQps"
  | "perDay"
  | "storage"
  | "ingress"
  | "egress"
  | "cache"
  | "servers"
  | "records";

export interface OutputRow {
  id: OutputId;
  label: string;
  value: string;
  sub?: string;
  working: string;
}

export type ShapeTone = "accent" | "good" | "warn" | "neutral";

export interface Verdict {
  shape: string;
  focus: string;
  tone: ShapeTone;
  /** The outputs that dominate the design for this shape. */
  dominant: OutputId[];
}

export interface Estimate {
  rows: OutputRow[];
  verdict: Verdict;
  writeQps: number;
  readQps: number;
  totalQps: number;
  storage: number;
}

const SECONDS_PER_DAY = 1e5; // 86,400 rounded up: the interview shortcut
const GOOGLE_QPS = 1e5;

function googleComparison(qps: number): string {
  const g = qps / GOOGLE_QPS;
  if (g >= 1.5) return `≈ ${num(g, 2)}× Google Search (~100k QPS)`;
  if (g >= 0.67) return "about Google Search (~100k QPS)";
  return `${num(g * 100, 2)}% of Google Search (~100k QPS)`;
}

export function shapeOf(v: Values, writeQps: number): Verdict {
  if (v.size >= 1e5) {
    return {
      shape: "Storage- and bandwidth-heavy",
      focus: "Object storage, a CDN, chunked uploads, deduplication and a separate metadata database.",
      tone: "accent",
      dominant: ["storage", "ingress", "egress"],
    };
  }
  if (v.ratio >= 10) {
    return {
      shape: "Read-heavy, tiny objects",
      focus: "Cache aggressively and add read replicas.",
      tone: "good",
      dominant: ["readQps", "cache"],
    };
  }
  if (writeQps >= 1e5 || (v.ratio <= 2 && writeQps >= 1e4)) {
    return {
      shape: "Write-heavy stream",
      focus: "Append-only logs (Kafka), sequential I/O, queues and partitioning.",
      tone: "warn",
      dominant: ["writeQps", "storage"],
    };
  }
  return {
    shape: "Modest load",
    focus: "A well-indexed database with a replica likely covers it. Saying so out loud is a green flag.",
    tone: "neutral",
    dominant: [],
  };
}

/** Shortest base-62 code length that covers `records` IDs. */
export function base62Length(records: number): number {
  let len = 1;
  while (62 ** len < records && len < 14) len++;
  return len;
}

export function estimate(v: Values): Estimate {
  const writesPerDay = v.dau * v.writes;
  const writeQps = writesPerDay / SECONDS_PER_DAY;
  const readQps = writeQps * v.ratio;
  const totalQps = writeQps + readQps;
  const perDay = writesPerDay * v.size;
  const storage = perDay * v.retention * v.replication;
  const ingress = writeQps * v.size;
  const egress = readQps * v.size;
  const cache = readQps * SECONDS_PER_DAY * v.size * 0.2;
  const servers = Math.ceil((totalQps * v.peak) / v.perServer);
  const records = writesPerDay * v.retention;
  const len = base62Length(records);

  const rows: OutputRow[] = [
    { id: "writesPerDay", label: "Writes per day", value: sci(writesPerDay), working: `${sci(v.dau)} users × ${num(v.writes)}` },
    {
      id: "writeQps",
      label: "Write QPS",
      value: `${fmtSI(writeQps)}/s`,
      sub: `peak ${fmtSI(writeQps * v.peak)}`,
      working: `${sci(writesPerDay)} ÷ 10⁵ s · peak × ${num(v.peak)}`,
    },
    {
      id: "readQps",
      label: "Read QPS",
      value: `${fmtSI(readQps)}/s`,
      sub: `peak ${fmtSI(readQps * v.peak)}`,
      working: `${fmtSI(writeQps)} × ${num(v.ratio)} reads per write`,
    },
    {
      id: "totalQps",
      label: "Total QPS",
      value: `${fmtSI(totalQps)}/s`,
      sub: `peak ${fmtSI(totalQps * v.peak)}`,
      working: `${fmtSI(writeQps)} + ${fmtSI(readQps)} · ${googleComparison(totalQps)}`,
    },
    { id: "perDay", label: "New data per day", value: fmtBytes(perDay), working: `${sci(writesPerDay)} × ${fmtBytes(v.size)}` },
    {
      id: "storage",
      label: "Total storage",
      value: fmtBytes(storage),
      working: `${fmtBytes(perDay)} × ${fmtInt(v.retention)} days × ${num(v.replication)} copies`,
    },
    {
      id: "ingress",
      label: "Ingress",
      value: `${fmtBytes(ingress)}/s`,
      sub: `≈ ${fmtBits(ingress)}`,
      working: `${fmtSI(writeQps)}/s × ${fmtBytes(v.size)} (× 8 for bits)`,
    },
    {
      id: "egress",
      label: "Egress",
      value: `${fmtBytes(egress)}/s`,
      sub: `≈ ${fmtBits(egress)}`,
      working: `${fmtSI(readQps)}/s × ${fmtBytes(v.size)}`,
    },
    {
      id: "cache",
      label: "Cache (20% of daily reads)",
      value: fmtBytes(cache),
      sub: "upper bound",
      working: `${fmtSI(readQps)}/s × 10⁵ s × ${fmtBytes(v.size)} × 20%`,
    },
    {
      id: "servers",
      label: "App servers",
      value: `~${fmtInt(servers)}`,
      sub: "+ headroom",
      working: `${fmtSI(totalQps * v.peak)} peak ÷ ${fmtSI(v.perServer)} per server`,
    },
    {
      id: "records",
      label: "Records kept",
      value: fmtSI(records),
      sub: `base-62 ID: ${len} chars`,
      working: `${sci(writesPerDay)} × ${fmtInt(v.retention)} days · 62${sup(len)} ≈ ${fmtSI(62 ** len)}`,
    },
  ];

  return { rows, verdict: shapeOf(v, writeQps), writeQps, readQps, totalQps, storage };
}
