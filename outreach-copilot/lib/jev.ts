import type { JevScore, Profile } from "./types";

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function scoreCopy(
  text: string,
  opts: {
    profile: Profile;
    kind: "email" | "linkedin" | "thesis" | "question";
    companyFacts?: string[];
  },
): JevScore {
  const scores: Record<string, number> = {
    specificity: 7,
    proof: 7,
    voice: 7,
    restraint: 7,
    ask: 7,
  };
  const blocks: JevScore["blocks"] = [];
  const flags: NonNullable<JevScore["flags"]> = [];
  const words = wordCount(text);
  const chars = text.length;
  const lower = text.toLowerCase();

  for (const line of opts.profile.banned.split("\n").map((s) => s.trim()).filter(Boolean)) {
    if (line && lower.includes(line.toLowerCase())) {
      blocks.push({ by: "banned", quote: line, note: "Banned claim from profile" });
      scores.proof = Math.min(scores.proof, 2);
    }
  }

  if (opts.kind === "email") {
    if (words < 40) {
      flags.push({ by: "length", note: "Very short" });
      scores.voice -= 1;
    }
    if (words > 220) {
      blocks.push({ by: "length", note: "Too long for cold email" });
      scores.restraint = 3;
    }
  }
  if (opts.kind === "linkedin" && chars > 280) {
    flags.push({ by: "length", note: "Long for LinkedIn" });
    scores.restraint -= 1;
  }

  const inventHints = [
    "i noticed you just",
    "congratulations on your recent",
    "saw you raised",
    "as you know",
  ];
  if (
    inventHints.some((h) => lower.includes(h)) &&
    !(opts.companyFacts || []).some((f) => f && lower.includes(f.slice(0, 24).toLowerCase()))
  ) {
    flags.push({
      by: "facts",
      note: "Possible invented signal — keep only sourced facts",
    });
    scores.proof -= 2;
  }

  if (!/[?]/.test(text) && opts.kind === "email") {
    scores.ask -= 1;
    flags.push({ by: "ask", note: "No clear question" });
  }

  if (/\b(synergy|leverage|cutting-edge|revolutionary)\b/i.test(text)) {
    scores.voice -= 2;
    flags.push({ by: "voice", quote: "buzzword" });
  }

  const composite = Number(
    (
      Object.values(scores).reduce((a, b) => a + b, 0) /
      Object.keys(scores).length
    ).toFixed(1),
  );

  let route: JevScore["route"] = "PASS";
  if (blocks.length) route = "BLOCK";
  else if (composite < 5.5) route = "REWRITE";
  else if (composite < 7 || flags.length) route = "OK";

  return {
    scores,
    composite,
    route,
    blocks,
    flags,
    words,
    chars,
  };
}

export function pickRecommend(scores: number[]): {
  recommend: number;
  close: boolean;
} {
  if (!scores.length) return { recommend: -1, close: false };
  let best = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i]! > scores[best]!) best = i;
  }
  const second = scores
    .map((s, i) => ({ s, i }))
    .filter((x) => x.i !== best)
    .sort((a, b) => b.s - a.s)[0];
  const close = !!second && Math.abs(scores[best]! - second.s) < 0.4;
  return { recommend: best, close };
}
