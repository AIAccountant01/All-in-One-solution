export type Profile = {
  name: string;
  target: string;
  facts: string;
  banned: string;
  voice: string;
};

export type Signal = {
  date: string;
  type: string;
  fact: string;
  url: string;
  sensitive?: boolean;
  sensitive_why?: string;
};

export type Research = {
  name: string;
  summary: string;
  takeaway?: string;
  fit_flags?: string[];
  signals: Signal[];
  best_hook?: number | null;
  hook_reason?: string;
  open_roles?: Signal[];
  dropped: number;
  models?: string[];
  claude_down?: string | null;
};

export type JevScore = {
  scores: Record<string, number>;
  composite: number;
  route: "PASS" | "OK" | "REWRITE" | "BLOCK";
  blocks: { by?: string; quote?: string; note?: string }[];
  flags?: { by?: string; quote?: string; note?: string }[];
  words?: number;
  chars?: number;
};

export type Thesis = {
  label: string;
  title: string;
  org_signal: string;
  proof: string;
  why: string;
  watch_out: string;
  jev: JevScore;
};

export type Person = {
  name: string;
  title: string;
  source_url: string;
  linkedin_url?: string;
  email?: string;
  email_guess?: string;
  pattern_example?: string;
  pattern_source_url?: string;
  web_check?: { refused?: boolean; p?: number };
};

export type PocResult = {
  people: Person[];
  recommend: number;
  recommend_reason?: string;
  web_check?: { citations?: { url: string; note?: string }[] };
  models?: string[];
  claude_down?: string | null;
};

export type SeqItem = {
  text: string;
  jev: JevScore & { attempts?: { route: string; composite?: number }[] };
  tries?: number;
  opening_signal_fact?: string;
  proofs?: string[];
};

export type SequenceDraft = {
  subjects: string[];
  items: Record<string, SeqItem>;
  distinct?: {
    ok: boolean;
    emails: { opening_signal_fact?: string; proofs: string[] }[];
    overlaps_left?: Record<string, string>;
  };
  sensitive?: Signal[];
  models?: string[];
  claude_down?: string | null;
};

export type KeysFromHeaders = {
  anthropic?: string;
  moonshot?: string;
  openrouter?: string;
};
