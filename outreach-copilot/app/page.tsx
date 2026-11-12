"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  Person,
  PocResult,
  Profile,
  Research,
  SequenceDraft,
  Thesis,
} from "@/lib/types";

const DEFAULT_PROFILE: Profile = {
  name: "Raghav R",
  target:
    "Bengaluru-based EIR, new business line or 0-to-1 business owner role. Not B2C, not forex, not US-resident roles.",
  facts:
    "About 15 years' experience, based in Bengaluru.\nVP, Founder's Office at Ai Accountant / Karbon Card (YC-backed).\nBuilt Karbon Card's accounting-AI product from a blank page: 70+ interviews with mid-sized CA firms of 20-40 people, 5 design partners.\nAt Karbon, took the B2B FX line from Rs 6 Cr to Rs 15 Cr monthly in 6 months by resetting segmentation, pricing and sales.\nLeads Restaurant Neo, his own restaurant-finance AI product (reconciles POS, delivery payouts, bank and books). Moved 5 brands with 10+ outlets each to pilot in 4 weeks. Converted a ~60-outlet F&B chain's reconciliation pilot into a recurring contract.\nEarlier at Amazon and Meesho: built new categories and supply hubs from scratch.\nCo-founded a no-code commerce platform: idea to 4,500+ users, raised early funding.",
  banned:
    "45-day product kill\nRs 40L P&L / 20-person team\ntwenty design-partner conversations\nmissed a quarterly CA-partnership target\nFX line breaking even or winding down\nRestaurant Neo described as a customer or employer",
  voice: `Hi {{first}},

AgentOS is live and Kapture just raised $10M to scale it. The hard part after a launch like that is rarely pipeline. It's turning pilots into contracts: enterprise buyers will run a proof of concept, but they sign only when the success metric was agreed on day one.

I've done this before:
• Turned a reconciliation pilot with a ~60-outlet F&B chain into a recurring contract by pricing it on the ops saving, not features.
• Reset segments, pricing and sales on Karbon Card's B2B FX line, taking it from ₹6 Cr to ₹15 Cr a month in six months.

Who owns AgentOS's pilot-to-contract motion today? If it's still open, would 20 minutes next week work?

Raghav`,
};

const KEY_DEFS = [
  {
    id: "anthropic" as const,
    label: "Anthropic (Claude) API key",
    ph: "sk-ant-…",
    header: "x-anthropic-key",
  },
  {
    id: "moonshot" as const,
    label: "Kimi / Moonshot API key",
    ph: "sk-…",
    header: "x-moonshot-key",
  },
  {
    id: "openrouter" as const,
    label: "OpenRouter API key (live-web check, Parallel Decisions)",
    ph: "sk-or-…",
    header: "x-openrouter-key",
  },
];

const ITEM_LABELS: Record<string, string> = {
  email1: "Email 1 · Initial",
  email2: "Email 2 · Follow-up",
  email3: "Email 3 · Close",
  linkedin1: "LinkedIn 1 · Connect",
  linkedin2: "LinkedIn 2",
  linkedin3: "LinkedIn 3",
};

type RunState = {
  step: number;
  company?: string;
  research?: Research;
  theses?: Thesis[];
  recommend?: number;
  close?: boolean;
  thesesBy?: { models?: string[]; claude_down?: string | null };
  pick?: number;
  pocs?: PocResult;
  poc?: number;
  qa?: { q: string; a: string; jev?: { composite?: number; route?: string; scores?: Record<string, number> } }[];
  qi?: number;
  extra?: string;
  qBy?: { models?: string[]; claude_down?: string | null };
  seq?: SequenceDraft;
  approve?: null | ApproveState;
};

type ApproveState = {
  open: boolean;
  to: string;
  checked: boolean;
  subject: number;
  sendNow: boolean;
  bodies: string[];
  gated: string[];
  gates: { route: string; composite?: number; blocks?: unknown[] }[];
  times: string[];
  done: null | { to: string; steps: { n: number; send_at_iso: string }[]; linkedin: string[] };
};

type HistoryItem = { company: string; at: string; run: RunState };

function ls(key: string, value?: unknown) {
  if (typeof window === "undefined") return null;
  if (value === undefined) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function readKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    // Prefer sessionStorage so keys do not survive browser restarts.
    const session = sessionStorage.getItem("keys");
    if (session) return JSON.parse(session) || {};
    const legacy = localStorage.getItem("keys");
    if (legacy) {
      sessionStorage.setItem("keys", legacy);
      localStorage.removeItem("keys");
      return JSON.parse(legacy) || {};
    }
    return {};
  } catch {
    return {};
  }
}

function writeKeys(next: Record<string, string>) {
  sessionStorage.setItem("keys", JSON.stringify(next));
  localStorage.removeItem("keys");
}

function writePass(value: string) {
  sessionStorage.setItem("pass", value);
  localStorage.removeItem("pass");
}

function keyHeaders() {
  const stored = readKeys();
  // Only forward non-empty overrides; server env keys are preferred when absent.
  return Object.fromEntries(
    KEY_DEFS.filter((k) => stored[k.id]?.trim()).map((k) => [k.header, stored[k.id]!.trim()]),
  );
}

/** Only allow http(s) links in the UI — blocks javascript:/data: etc. */
function safeHref(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* ignore */
  }
  return undefined;
}

function ExtLink({
  href,
  children,
}: {
  href?: string | null;
  children: ReactNode;
}) {
  const safe = safeHref(href);
  if (!safe) return <span className="mute">{children}</span>;
  return (
    <a href={safe} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

function shortModel(id: string) {
  // openrouter:nemotron-3-nano-omni-…:free → nemotron…:free
  const leaf = id.includes(":") ? id.split(":").slice(1).join(":") : id;
  const base = leaf.split("/").pop() || leaf;
  return base.length > 28 ? `${base.slice(0, 18)}…${base.slice(-6)}` : base;
}

function Byline({ r }: { r?: { models?: string[]; claude_down?: string | null } | null }) {
  if (!r?.models?.length) return null;
  const note =
    r.claude_down === "credit"
      ? "Claude: key rejected"
      : r.claude_down === "missing"
        ? "no Anthropic"
        : r.claude_down
          ? "Claude down"
          : "";
  const label = r.models.map(shortModel).join(" + ");
  return (
    <span className="pill" title={`${r.models.join(" + ")}${note ? ` · ${note}` : ""}`} style={{ fontSize: 11 }}>
      by {label}
      {note ? ` · ${note}` : ""}
    </span>
  );
}

function defaultTimes(sendNow: boolean) {
  const now = new Date();
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const t0 = sendNow ? now : new Date(now.getTime() + 15 * 60_000);
  const t1 = new Date(t0.getTime() + 3 * 24 * 3600_000);
  const t2 = new Date(t0.getTime() + 7 * 24 * 3600_000);
  return [fmt(t0), fmt(t1), fmt(t2)];
}

function parseLocal(v: string) {
  return new Date(v).getTime();
}

export default function Page() {
  const [tab, setTab] = useState<"run" | "scheduled" | "history" | "profile">("run");
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [pass, setPass] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [run, setRun] = useState<RunState>({ step: 0 });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [own, setOwn] = useState("");
  const [showOwn, setShowOwn] = useState(false);
  const [autopilot, setAutopilot] = useState(true);

  useEffect(() => {
    const p = ls("profile") as Profile | null;
    if (p) {
      if (p.voice && /That's the motion I've built:/.test(p.voice)) {
        p.voice = DEFAULT_PROFILE.voice;
        ls("profile", p);
      }
      setProfile(p);
    }
    try {
      const sessionPass = sessionStorage.getItem("pass");
      const legacyPass = ls("pass");
      if (typeof sessionPass === "string") setPass(sessionPass);
      else if (typeof legacyPass === "string") {
        setPass(legacyPass);
        sessionStorage.setItem("pass", legacyPass);
        localStorage.removeItem("pass");
      }
    } catch {
      /* ignore */
    }
    const h = ls("history");
    if (Array.isArray(h)) setHistory(h);
    const cur = ls("current") as RunState | null;
    if (cur?.step) setRun(cur);
    const ap = ls("autopilot");
    if (typeof ap === "boolean") setAutopilot(ap);
  }, []);

  useEffect(() => {
    if (run.step) ls("current", run);
  }, [run]);

  async function request<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`/api/${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-passcode": pass,
        ...keyHeaders(),
      },
      body: JSON.stringify({ ...(body as object), profile }),
    });
    const raw = await res.text();
    let data: { error?: string } & Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as typeof data) : {};
    } catch {
      const looksHtml = /^\s*<!doctype|^\s*<html/i.test(raw);
      throw new Error(
        looksHtml
          ? `Server returned a web page instead of data (HTTP ${res.status}). Try again in a moment — if it keeps happening, refresh and re-open the app.`
          : `Bad server response (HTTP ${res.status}): ${raw.slice(0, 120) || "empty"}`,
      );
    }
    if (!res.ok) throw new Error((data.error as string) || `Request failed (${res.status})`);
    return data as T;
  }

  async function api<T>(path: string, body: unknown, label: string): Promise<T | null> {
    setErr("");
    setBusy(label);
    try {
      return await request<T>(path, body);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      return null;
    } finally {
      setBusy("");
    }
  }

  function normalizeResearch(data: Research, company: string): Research {
    return {
      ...data,
      name: data.name?.trim() || company || "Company",
      summary: data.summary?.trim() || "No usable summary from live sources yet.",
      signals: data.signals || [],
    };
  }

  function saveHistory(next: RunState) {
    const company = next.research?.name || next.company || "";
    const hist = [
      { company, at: new Date().toISOString(), run: next },
      ...history.filter((h) => h.company !== company),
    ].slice(0, 30);
    setHistory(hist);
    ls("history", hist);
  }

  const doResearch = async () => {
    const data = await api<Research>("research", { company: run.company }, "Researching what's moving…");
    if (!data) return;
    if (!data.name?.trim() && !data.summary?.trim() && !(data.signals?.length > 0)) {
      setErr("Research came back empty. Try again, or check Profile → API keys / server secrets.");
      return;
    }
    setRun({
      ...run,
      step: 2,
      research: normalizeResearch(data, run.company || ""),
    });
  };

  const doTheses = async (ownText?: string) => {
    const data = await api<{
      theses: Thesis[];
      recommend: number;
      close: boolean;
      models?: string[];
      claude_down?: string | null;
    }>("theses", { company: run.company, research: run.research, own: ownText }, "Writing theses and scoring them with Jev…");
    if (data) {
      setRun({
        ...run,
        step: 3,
        theses: data.theses,
        recommend: data.recommend,
        close: data.close,
        thesesBy: { models: data.models, claude_down: data.claude_down },
      });
    }
  };

  const doPoc = async (idx: number) => {
    const data = await api<PocResult>(
      "poc",
      { research: run.research, thesis: run.theses![idx] },
      "Finding the right person to write to…",
    );
    if (data) {
      setRun({
        ...run,
        step: 3.5,
        pick: idx,
        pocs: data,
        poc: data.people?.[data.recommend] ? data.recommend : -1,
      });
    }
  };

  const doQuestions = async () => {
    const poc = run.pocs?.people?.[run.poc ?? -1] || null;
    const data = await api<{
      questions: string[];
      kept?: { composite?: number; route?: string; scores?: Record<string, number> }[];
      models?: string[];
      claude_down?: string | null;
    }>("questions", { research: run.research, thesis: run.theses![run.pick!], poc }, "Picking your sharpest questions (Jev-scored)…");
    if (data) {
      setRun({
        ...run,
        step: 4,
        qa: data.questions.map((q, i) => ({ q, a: "", jev: data.kept?.[i] })),
        qi: 0,
        extra: "",
        qBy: { models: data.models, claude_down: data.claude_down },
      });
    }
  };

  const doDraft = async () => {
    const poc = run.pocs?.people?.[run.poc ?? -1] || null;
    const qa = [...(run.qa || []), ...(run.extra ? [{ q: "Anything else", a: run.extra }] : [])];
    const data = await api<SequenceDraft>(
      "draft",
      { research: run.research, thesis: run.theses![run.pick!], qa, poc },
      "Drafting, then Jev-checking every message…",
    );
    if (data) {
      const next = { ...run, step: 5, seq: data, approve: null };
      setRun(next);
      saveHistory(next);
    }
  };

  const runAutopilot = async () => {
    const company = (run.company || "").trim();
    if (!company) return;
    setErr("");
    let next: RunState = { step: 1, company };
    setRun(next);
    try {
      setBusy("1/4 Researching what's moving…");
      const researchRaw = await request<Research>("research", { company });
      if (!researchRaw.name?.trim() && !researchRaw.summary?.trim() && !(researchRaw.signals?.length > 0)) {
        throw new Error("Research came back empty. Try again, or check Profile → API keys / server secrets.");
      }
      const research = normalizeResearch(researchRaw, company);
      next = { ...next, step: 2, research };
      setRun(next);

      setBusy("2/4 Writing theses and picking the best…");
      const thesesData = await request<{
        theses: Thesis[];
        recommend: number;
        close: boolean;
        models?: string[];
        claude_down?: string | null;
      }>("theses", { company, research });
      if (!thesesData.theses?.length) throw new Error("No theses returned. Try step-by-step Research.");
      const pick =
        thesesData.recommend >= 0 && thesesData.theses[thesesData.recommend]
          ? thesesData.recommend
          : 0;
      next = {
        ...next,
        step: 3,
        theses: thesesData.theses,
        recommend: thesesData.recommend,
        close: thesesData.close,
        thesesBy: { models: thesesData.models, claude_down: thesesData.claude_down },
        pick,
      };
      setRun(next);

      setBusy("3/4 Finding the right person to write to…");
      const thesis = thesesData.theses[pick]!;
      const pocs = await request<PocResult>("poc", { research, thesis });
      const pocIdx = pocs.people?.[pocs.recommend] ? pocs.recommend : pocs.people?.length ? 0 : -1;
      next = { ...next, step: 3.5, pocs, poc: pocIdx };
      setRun(next);

      setBusy("4/4 Drafting your sequence…");
      const poc = pocIdx >= 0 ? pocs.people[pocIdx]! : null;
      const seq = await request<SequenceDraft>("draft", {
        research,
        thesis,
        poc,
        qa: [
          {
            q: "Autopilot",
            a: "Used recommended thesis and recipient. Draft from profile voice and live research; no extra Q&A.",
          },
        ],
      });
      next = {
        ...next,
        step: 5,
        seq,
        approve: null,
        qa: [],
        qi: 0,
        extra: "",
      };
      setRun(next);
      saveHistory(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Autopilot failed");
      setRun(next);
    } finally {
      setBusy("");
    }
  };

  const mdExport = () => {
    const a = run.research!;
    const t = run.theses![run.pick!];
    const n = run.seq!;
    const l = run.pocs?.people?.[run.poc ?? -1];
    return `# ${a.name} outreach sequence

${a.summary}

${a.takeaway ? `## What this means for you\n${a.takeaway}\n\n` : ""}${
      l
        ? `## Recipient\n${l.name}, ${l.title} (${l.source_url})${
            l.email
              ? `\nEmail: ${l.email}`
              : l.email_guess
                ? `\nEmail guess (unverified, from pattern ${l.pattern_example}): ${l.email_guess}`
                : ""
          }\n\n`
        : ""
    }## What's moving
${a.signals.map((s) => `- ${s.date} · ${s.type}: ${s.fact} (${s.url})`).join("\n")}

## Thesis
${t.title}
Proof: ${t.proof}

## Subjects
${n.subjects.map((s) => `- ${s}`).join("\n")}

${Object.entries(n.items)
  .map(([k, v]) => {
    const label = ITEM_LABELS[k] || k;
    const score =
      v.jev.composite != null
        ? ` (Jev ${v.jev.composite}, ${v.jev.route})`
        : ` (${v.jev.route})`;
    return `## ${label}${score}\n${v.text}`;
  })
  .join("\n\n")}`;
  };

  const reset = () => {
    localStorage.removeItem("current");
    setRun({ step: 0 });
    setOwn("");
    setShowOwn(false);
    setErr("");
  };

  const STEP_ORDER = [1, 2, 3, 3.5, 4, 5] as const;

  const goBack = () => {
    if (busy) return;
    setErr("");
    // Close approve sheet first
    if (run.step === 5 && run.approve?.open) {
      setRun({ ...run, approve: { ...run.approve, open: false } });
      return;
    }
    // Within Q&A, go to the previous question before leaving the step
    if (run.step === 4 && (run.qi || 0) > 0) {
      setRun({ ...run, qi: (run.qi || 0) - 1 });
      return;
    }
    const idx = STEP_ORDER.indexOf(run.step as (typeof STEP_ORDER)[number]);
    if (idx <= 0) {
      setRun({ step: 0 });
      return;
    }
    const prev = STEP_ORDER[idx - 1]!;
    setRun({ ...run, step: prev });
  };

  const canGoBack = (run.step || 0) > 1 || (run.step === 4 && (run.qi || 0) > 0) || !!run.approve?.open;

  return (
    <div className="wrap">
      <header>
        <h1>
          Outreach <span>Copilot</span>
        </h1>
        <div className="tabs">
          {(["run", "scheduled", "history", "profile"] as const).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t[0]!.toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {tab === "profile" && (
        <ProfileTab
          profile={profile}
          setProfile={(p) => {
            setProfile(p);
            ls("profile", p);
          }}
          pass={pass}
          setPass={(p) => {
            setPass(p);
            writePass(p);
          }}
        />
      )}

      {tab === "scheduled" && <ScheduledTab pass={pass} />}

      {tab === "history" &&
        (history.length ? (
          history.map((e, i) => (
            <div className="card" key={i}>
              <div className="row">
                <div className="grow">
                  <h3>{e.company}</h3>
                  <div className="mute">{new Date(e.at).toLocaleString()}</div>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setRun(e.run);
                    setTab("run");
                  }}
                >
                  Open
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="mute">Sequences you build show up here.</p>
        ))}

      {tab === "run" && (
        <>
          <div className="row" style={{ marginBottom: 8, alignItems: "center" }}>
            {canGoBack ? (
              <button className="btn ghost" type="button" disabled={!!busy} onClick={goBack}>
                ← Back
              </button>
            ) : (
              <span />
            )}
            <div className="steps grow" style={{ margin: 0, justifyContent: "flex-end" }}>
              {STEP_ORDER.map((s) => (
                <i key={s} className={(run.step || 1) >= s ? "on" : ""} />
              ))}
            </div>
          </div>

          {(run.step || 0) <= 1 && (
            <div className="card">
              <h3>Which company?</h3>
              <p className="mute">
                Autopilot researches, picks the recommended thesis and person, then drafts a sequence.
                Turn it off to go step by step.
              </p>
              <label className="row" style={{ marginBottom: 10, gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={autopilot}
                  disabled={!!busy}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setAutopilot(on);
                    ls("autopilot", on);
                  }}
                />
                <span>
                  Autopilot <span className="mute">· approve only at the end</span>
                </span>
              </label>
              <div className="row">
                <input
                  className="grow"
                  placeholder="e.g. NatWest"
                  value={run.company || ""}
                  onChange={(e) => setRun({ step: 1, company: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !run.company || busy) return;
                    if (autopilot) void runAutopilot();
                    else void doResearch();
                  }}
                />
                {autopilot ? (
                  <button className="btn" disabled={!run.company || !!busy} onClick={() => void runAutopilot()}>
                    Autopilot →
                  </button>
                ) : (
                  <button className="btn" disabled={!run.company || !!busy} onClick={() => void doResearch()}>
                    Research
                  </button>
                )}
              </div>
              {autopilot && (
                <p className="mute" style={{ marginTop: 8 }}>
                  Prefer control? Uncheck Autopilot to review theses and people yourself.
                </p>
              )}
            </div>
          )}

          {run.step >= 2 && run.research && (
            <div className="card">
              <div className="row" style={{ alignItems: "flex-start" }}>
                <h3 className="grow" style={{ marginRight: 8 }}>
                  {run.research.name || run.company || "Company"}
                </h3>
                <Byline r={run.research} />
                <button className="btn ghost" onClick={reset}>
                  New company
                </button>
              </div>
              <p>{run.research.summary || "No summary yet."}</p>
              {!run.research.signals?.length && (
                <p className="err">
                  No live signals with loading sources. Try Research again, or add your own read.
                </p>
              )}
              {!!run.research.fit_flags?.filter(Boolean).length && (
                <p className="err">Fit check: {run.research.fit_flags.join(" · ")}</p>
              )}
              {run.research.takeaway && (
                <div className="takeaway">
                  <span className="lbl">What this means for you</span>
                  <div>{run.research.takeaway}</div>
                </div>
              )}
              {run.research.best_hook != null && run.research.signals[run.research.best_hook] && (
                <p>
                  Best hook: {run.research.signals[run.research.best_hook]!.fact}
                  {run.research.hook_reason ? ` (${run.research.hook_reason})` : ""}
                </p>
              )}
              {!!run.research.open_roles?.length && (
                <p className="mute">
                  Open roles (undated or older than 60 days, not used as a hook):{" "}
                  {run.research.open_roles.map((e, i) => (
                    <ExtLink key={i} href={e.url}>
                      {e.fact.replace("Open role: ", "")}
                      {i < run.research!.open_roles!.length - 1 ? " · " : ""}
                    </ExtLink>
                  ))}
                </p>
              )}
              {run.research.signals.map((e, i) => (
                <div className="card" key={i} style={{ margin: "8px 0" }}>
                  <div className="row">
                    <span className="pill">{e.date}</span>
                    <span className="pill">{e.type}</span>
                    {run.research!.best_hook === i && <span className="pill PASS">best hook</span>}
                    {e.sensitive && (
                      <span className="pill BLOCK" title={e.sensitive_why}>
                        sensitive · not a hook
                      </span>
                    )}
                  </div>
                  {e.fact}{" "}
                  <ExtLink href={e.url}>source</ExtLink>
                </div>
              ))}
              {run.research.dropped > 0 && (
                <p className="mute">
                  {run.research.dropped} signal(s) dropped because their source didn&apos;t load.
                </p>
              )}
              {run.step === 2 && (
                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    className="btn"
                    disabled={!!busy || !run.research.signals.length}
                    onClick={() => doTheses()}
                  >
                    Build theses
                  </button>
                  <button className="btn ghost" onClick={() => setShowOwn(!showOwn)}>
                    I have my own read
                  </button>
                </div>
              )}
              {run.step === 2 && showOwn && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    placeholder="What do you think they're facing? A team they're building, something breaking, a person you know there…"
                    value={own}
                    onChange={(e) => setOwn(e.target.value)}
                  />
                  <button
                    className="btn"
                    style={{ marginTop: 8 }}
                    disabled={!own || !!busy}
                    onClick={() => doTheses(own)}
                  >
                    Build from my thesis
                  </button>
                </div>
              )}
            </div>
          )}

          {run.step >= 3 && run.theses && (
            <>
              <h2>
                Problem theses{" "}
                {run.close && <span className="mute">· close call, check both</span>}{" "}
                <Byline r={run.thesesBy} />
              </h2>
              {run.theses.map((e, i) =>
                run.step === 3 || run.pick === i ? (
                  <div
                    className={"card" + (run.pick === i || (run.step === 3 && run.recommend === i) ? " pick" : "")}
                    key={i}
                  >
                    <div className="row">
                      <span className="lbl grow">
                        {run.recommend === -1
                          ? e.label
                          : run.recommend === i
                            ? "Recommended"
                            : "Alternative"}
                      </span>
                      <span className="pill">{`Jev ${e.jev.composite}`}</span>
                      <span className={`pill ${e.jev.route}`}>{e.jev.route}</span>
                    </div>
                    <h3 style={{ marginTop: 6 }}>{e.title}</h3>
                    <p>
                      <b>Org signal.</b> {e.org_signal}
                    </p>
                    <p>
                      <b>Your proof.</b> {e.proof}
                    </p>
                    <p>
                      <b>Why it lands.</b> {e.why}
                    </p>
                    <p>
                      <b>Watch out.</b> {e.watch_out}
                    </p>
                    <div className="mute">
                      {Object.entries(e.jev.scores)
                        .map(([k, v]) => `${k.replace("_", " ")} ${v}`)
                        .join(" · ")}
                    </div>
                    {run.step === 3 && (
                      <button
                        className="btn"
                        style={{ marginTop: 10 }}
                        disabled={!!busy}
                        onClick={() => doPoc(i)}
                      >
                        Select this thesis →
                      </button>
                    )}
                  </div>
                ) : null,
              )}
            </>
          )}

          {run.step >= 3.5 && run.pocs && (
            <div className="card">
              <div className="row">
                <h3 className="grow">Who to write to</h3>
                <Byline r={run.pocs} />
              </div>
              <p className="mute">
                Real people only, each with a source that loads.{" "}
                {run.step === 3.5 ? "Pick the recipient; their name and role shape the email." : ""}
              </p>
              {!run.pocs.people?.length && (
                <p className="err">
                  No decision-maker could be verified from live sources. You can still draft to &quot;the
                  founder&quot; generically.
                </p>
              )}
              {(run.pocs.people || []).map((e, i) =>
                run.step === 3.5 || run.poc === i ? (
                  <label key={i} className={"poc" + (run.poc === i ? " pick" : "")}>
                    {run.step === 3.5 && (
                      <input
                        type="radio"
                        name="poc"
                        checked={run.poc === i}
                        onChange={() => setRun({ ...run, poc: i })}
                      />
                    )}{" "}
                    <b>{e.name}</b> — {e.title}
                    {run.pocs!.recommend === i && <span className="pill PASS">recommended</span>}
                    <div className="mute">
                      <ExtLink href={e.source_url}>source</ExtLink>
                      {e.linkedin_url && (
                        <>
                          {" · "}
                          <ExtLink href={e.linkedin_url}>LinkedIn</ExtLink>
                        </>
                      )}
                      {e.email && <> · {e.email} (shown here)</>}
                      {!e.email && e.email_guess && (
                        <>
                          {" · "}
                          {e.email_guess} — guess from pattern {e.pattern_example}
                        </>
                      )}
                      {!e.email && !e.email_guess && " · no email found"}
                    </div>
                  </label>
                ) : null,
              )}
              {run.step === 3.5 && run.pocs.recommend_reason && (
                <p className="mute">Why the recommendation: {run.pocs.recommend_reason}</p>
              )}
              {run.step === 3.5 && (
                <button
                  className="btn"
                  style={{ marginTop: 10 }}
                  disabled={!!busy || ((run.pocs.people?.length ?? 0) > 0 && (run.poc ?? -1) < 0)}
                  onClick={doQuestions}
                >
                  Continue →
                </button>
              )}
            </div>
          )}

          {run.step === 4 && run.qa && (
            <div className="card">
              <div className="row">
                <h3 className="grow">Sharpen the angle</h3>
                <Byline r={run.qBy} />
              </div>
              {(() => {
                const a = run.qi || 0;
                const n = a >= run.qa!.length;
                const l = n ? null : run.qa![a];
                if (n) {
                  return (
                    <>
                      <p className="mute">Anything else before I draft?</p>
                      <textarea
                        value={run.extra || ""}
                        onChange={(e) => setRun({ ...run, extra: e.target.value })}
                        placeholder="Optional notes"
                      />
                      <div className="row" style={{ marginTop: 10, gap: 8 }}>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={() => setRun({ ...run, qi: Math.max(0, run.qa!.length - 1) })}
                        >
                          ← Back
                        </button>
                        <button className="btn" disabled={!!busy} onClick={doDraft}>
                          Build my sequence →
                        </button>
                      </div>
                    </>
                  );
                }
                return (
                  <>
                    <p className="mute">
                      Question {a + 1} of {run.qa!.length}
                      {l?.jev?.composite != null ? ` · Jev ${l.jev.composite}` : ""}
                    </p>
                    {l?.jev?.route && (
                      <span className={`pill ${l.jev.route}`}>
                        {l.jev.route}
                        {l.jev.composite != null ? ` · ${l.jev.composite}` : ""}
                      </span>
                    )}
                    <h3 style={{ marginTop: 8 }}>{l!.q}</h3>
                    <textarea
                      value={l!.a}
                      onChange={(e) => {
                        const qa = [...run.qa!];
                        qa[a] = { ...qa[a]!, a: e.target.value };
                        setRun({ ...run, qa });
                      }}
                    />
                    <div className="row" style={{ marginTop: 10, gap: 8 }}>
                      {a > 0 && (
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={() => setRun({ ...run, qi: a - 1 })}
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        className="btn"
                        onClick={() => setRun({ ...run, qi: a + 1 })}
                      >
                        {l!.a.trim() ? "Next →" : "Skip →"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {run.step === 5 && run.seq && (
            <>
              {!run.qa?.length && (
                <div className="card" style={{ borderColor: "var(--gold)" }}>
                  <span className="lbl">Autopilot</span>
                  <p style={{ margin: "6px 0 0" }}>
                    Used the recommended thesis
                    {run.pick != null && run.theses?.[run.pick] ? ` (“${run.theses[run.pick]!.title}”)` : ""}
                    {run.poc != null && run.poc >= 0 && run.pocs?.people?.[run.poc]
                      ? ` and ${run.pocs.people[run.poc]!.name}`
                      : " and a generic recipient"}
                    . Use ← Back to change picks, or Approve when it looks right.
                  </p>
                </div>
              )}
              <h2>
                Your sequence <Byline r={run.seq} />
              </h2>
              <div className="card">
                <span className="lbl">Subject options</span>
                {run.seq.subjects.map((e, i) => (
                  <div className="row" key={i}>
                    <span className="grow">{e}</span>
                    <button className="btn ghost" onClick={() => navigator.clipboard.writeText(e)}>
                      Copy
                    </button>
                  </div>
                ))}
              </div>
              {run.seq.distinct && (
                <div className="card">
                  <span className="lbl">
                    Distinct hooks & proofs {run.seq.distinct.ok ? "✓" : "✗ (check below)"}
                  </span>
                  {run.seq.distinct.emails.map((e, i) => (
                    <div className="mute" key={i}>
                      Email {i + 1}: opens on{" "}
                      {e.opening_signal_fact
                        ? `"${e.opening_signal_fact.slice(0, 90)}"`
                        : "the problem (no company event)"}{" "}
                      · proof: {e.proofs.length ? e.proofs.map((p) => p.slice(0, 60)).join(" + ") : "none"}
                    </div>
                  ))}
                  {!!Object.keys(run.seq.distinct.overlaps_left || {}).length && (
                    <div className="err">Overlapping openings — edit before sending.</div>
                  )}
                  {!!run.seq.sensitive?.length && (
                    <div className="mute">
                      Kept out of the emails (sensitive):{" "}
                      {run.seq.sensitive.map((s) => s.fact).join(" · ")}
                    </div>
                  )}
                </div>
              )}
              {Object.entries(run.seq.items).map(([k, l]) => (
                <div className="card" key={k}>
                  <div className="row">
                    <span className="lbl grow">{ITEM_LABELS[k] || k}</span>
                    <span className={`pill ${l.jev.route}`}>
                      {l.jev.route}
                      {l.jev.composite != null ? ` · ${l.jev.composite}` : ""}
                    </span>
                    <button className="btn ghost" onClick={() => navigator.clipboard.writeText(l.text)}>
                      Copy
                    </button>
                  </div>
                  <div className="mute">
                    {l.jev.scores &&
                      Object.entries(l.jev.scores)
                        .map(([s, a]) => `${s.replace("_", " ")} ${a}`)
                        .join(" · ")}
                    {l.jev.words
                      ? ` · ${k.startsWith("linkedin") ? `${l.jev.chars} chars` : `${l.jev.words} words`}`
                      : ""}
                    {l.tries ? ` · rewritten ${l.tries}×` : ""}
                  </div>
                  <pre>{l.text}</pre>
                </div>
              ))}
              <div className="row">
                <button
                  className="btn"
                  onClick={() => {
                    const poc = run.pocs?.people?.[run.poc ?? -1];
                    setRun({
                      ...run,
                      approve: {
                        open: true,
                        to: poc?.email || poc?.email_guess || "",
                        checked: false,
                        subject: 0,
                        sendNow: false,
                        bodies: ["email1", "email2", "email3"].map((k) => run.seq!.items[k]!.text),
                        gated: ["email1", "email2", "email3"].map((k) => run.seq!.items[k]!.text),
                        gates: ["email1", "email2", "email3"].map((k) => ({
                          route: run.seq!.items[k]!.jev.route,
                          composite: run.seq!.items[k]!.jev.composite,
                          blocks: run.seq!.items[k]!.jev.blocks,
                        })),
                        times: defaultTimes(false),
                        done: null,
                      },
                    });
                  }}
                >
                  Approve & schedule →
                </button>
                <button
                  className="btn ghost"
                  onClick={() => {
                    const blob = new Blob([mdExport()], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${(run.research!.name || run.company || "outreach")
                      .toLowerCase()
                      .replace(/\W+/g, "-")}.md`;
                    a.click();
                  }}
                >
                  Download .md
                </button>
                <button
                  className="btn ghost"
                  onClick={() => navigator.clipboard.writeText(mdExport())}
                >
                  Copy all
                </button>
                <button className="btn ghost" onClick={reset}>
                  New company
                </button>
              </div>
              {run.approve?.open && (
                <ApprovePanel
                  run={run}
                  setRun={setRun}
                  pass={pass}
                  profile={profile}
                />
              )}
            </>
          )}

          {busy && (
            <p className="mute">
              <span className="spin" />
              {busy}
            </p>
          )}
          {err && (
            <div className="err">
              {err}
              {/api key|Claude:|Kimi:|Research needs/i.test(err) && (
                <button
                  className="btn ghost"
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    setTab("profile");
                    setTimeout(() => document.getElementById("keys")?.scrollIntoView(), 50);
                  }}
                >
                  Add keys
                </button>
              )}
              {err === "Wrong passcode" && (
                <div className="row" style={{ marginTop: 8 }}>
                  <input
                    className="grow"
                    type="password"
                    placeholder="Enter passcode"
                    onChange={(e) => {
                      setPass(e.target.value);
                      writePass(e.target.value);
                    }}
                  />
                  <button className="btn ghost" onClick={() => setErr("")}>
                    Save
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProfileTab({
  profile,
  setProfile,
  pass,
  setPass,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  pass: string;
  setPass: (p: string) => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, { busy?: boolean; ok?: boolean; error?: string }>>({});

  useEffect(() => {
    setKeys(readKeys());
  }, []);

  const saveKeys = (next: Record<string, string>) => {
    setKeys(next);
    writeKeys(next);
  };

  return (
    <div className="card">
      <h3>Your profile</h3>
      <p className="mute">Used to ground theses, voice, and banned claims. Saved in this browser.</p>
      {(
        [
          ["name", "Name"],
          ["target", "Target roles"],
          ["facts", "Facts / proof"],
          ["banned", "Banned claims"],
          ["voice", "Voice sample"],
        ] as const
      ).map(([k, label]) => (
        <div key={k} style={{ margin: "12px 0" }}>
          <span className="lbl">{label}</span>
          {k === "name" ? (
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          ) : (
            <textarea
              value={profile[k]}
              onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
            />
          )}
        </div>
      ))}
      <div style={{ margin: "12px 0" }}>
        <span className="lbl">App passcode</span>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="App passcode"
        />
      </div>
      <div id="keys" style={{ marginTop: 18 }}>
        <h3>API keys</h3>
        <p className="mute">
          Optional overrides for this browser tab only (sessionStorage — cleared when the tab
          closes). Prefer server / published secrets when set; leave these empty to use them. Keys
          are only sent as request headers when you paste an override.
        </p>
        {KEY_DEFS.map((e) => {
          const saved = keys[e.id];
          return (
            <div key={e.id} style={{ margin: "12px 0" }}>
              <span className="lbl">{e.label}</span>
              {saved && (
                <div className="mute">Saved · ends with …{saved.slice(-4)}</div>
              )}
              <div className="row">
                <input
                  className="grow"
                  type="password"
                  placeholder={e.ph}
                  value={draft[e.id] || ""}
                  onChange={(ev) => setDraft({ ...draft, [e.id]: ev.target.value })}
                />
                <button
                  className="btn ghost"
                  disabled={!!status[e.id]?.busy}
                  onClick={async () => {
                    const key = (draft[e.id] || "").trim() || keys[e.id] || "";
                    if (!key) return;
                    setStatus({ ...status, [e.id]: { busy: true } });
                    try {
                      const res = await fetch("/api/keys/test", {
                        method: "POST",
                        headers: {
                          "content-type": "application/json",
                          "x-passcode": pass,
                        },
                        body: JSON.stringify({ id: e.id, key }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) throw new Error(data.error || "failed");
                      saveKeys({ ...keys, [e.id]: key });
                      setDraft({ ...draft, [e.id]: "" });
                      setStatus({ ...status, [e.id]: { ok: true } });
                    } catch (err) {
                      setStatus({
                        ...status,
                        [e.id]: {
                          ok: false,
                          error: err instanceof Error ? err.message : "failed",
                        },
                      });
                    }
                  }}
                >
                  {status[e.id]?.busy ? "Testing…" : "Save & test"}
                </button>
                {saved && (
                  <button
                    className="btn ghost"
                    onClick={() => {
                      const next = { ...keys };
                      delete next[e.id];
                      saveKeys(next);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {status[e.id]?.ok && <div className="mute">Key works.</div>}
              {status[e.id]?.error && <div className="err">{status[e.id]?.error}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduledTab({ pass }: { pass: string }) {
  const [rows, setRows] = useState<
    {
      id: string;
      company: string;
      to: string;
      status: string;
      test?: boolean;
      steps: { n: number; send_at_iso: string }[];
    }[]
  >([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const res = await fetch("/api/sequences", { headers: { "x-passcode": pass } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.sequences || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="err">{error}</p>;
  if (!rows.length) return <p className="mute">Approved sequences show up here.</p>;

  const tone: Record<string, string> = {
    active: "PASS",
    replied: "PASS",
    done: "",
    cancelled: "BLOCK",
  };

  return (
    <>
      {rows.map((e) => (
        <div className="card" key={e.id}>
          <div className="row">
            <div className="grow">
              <h3 style={{ margin: 0 }}>
                {e.company}
                {e.test ? " (test)" : ""}
              </h3>
              <div className="mute">
                To {e.to} · {(e.steps || []).map((s) => `Email ${s.n}: ${new Date(s.send_at_iso).toLocaleString()}`).join(" · ")}
              </div>
            </div>
            <span className={`pill ${tone[e.status] || ""}`}>{e.status}</span>
            {e.status === "active" && (
              <button
                className="btn ghost"
                onClick={async () => {
                  if (!confirm("Cancel this sequence? Unsent emails won't go out.")) return;
                  await fetch("/api/sequences/cancel", {
                    method: "POST",
                    headers: {
                      "content-type": "application/json",
                      "x-passcode": pass,
                    },
                    body: JSON.stringify({ id: e.id }),
                  });
                  load();
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function ApprovePanel({
  run,
  setRun,
  pass,
  profile,
}: {
  run: RunState;
  setRun: (r: RunState) => void;
  pass: string;
  profile: Profile;
}) {
  const m = run.approve!;
  const poc = run.pocs?.people?.[run.poc ?? -1] as Person | undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gateBusy, setGateBusy] = useState<Record<number, boolean>>({});

  if (m.done) {
    return (
      <div className="card pick">
        <h3>Approved and scheduled</h3>
        <p>{m.done.steps.map((e) => `Email ${e.n}: ${new Date(e.send_at_iso).toLocaleString()}`).join(" · ")}</p>
        <p className="mute">
          To {m.done.to}. It stops on its own if they reply. Manage it in the Scheduled tab.
        </p>
        <span className="lbl">LinkedIn (send these yourself)</span>
        {m.done.linkedin.map((e, i) => (
          <div className="mute" style={{ marginTop: 6 }} key={i}>
            {i + 1}. {e}
          </div>
        ))}
      </div>
    );
  }

  const reGate = async (idx: number, body: string) => {
    if (body === m.gated[idx]) return;
    setGateBusy((s) => ({ ...s, [idx]: true }));
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-passcode": pass,
          ...keyHeaders(),
        },
        body: JSON.stringify({ body, profile, kind: "email" }),
      });
      const data = await res.json();
      const next = { ...m };
      next.gates = [...next.gates];
      next.gated = [...next.gated];
      next.gates[idx] = {
        route: data.jev.route,
        composite: data.jev.composite,
        blocks: data.jev.blocks,
      };
      next.gated[idx] = body;
      setRun({ ...run, approve: next });
    } finally {
      setGateBusy((s) => ({ ...s, [idx]: false }));
    }
  };

  const dirty = m.bodies.some((b, i) => b !== m.gated[i]);
  const blocked = m.gates.some((g) => g.route === "BLOCK");
  const timesOk = m.times.every(
    (t, i) => !isNaN(parseLocal(t)) && (i === 0 || parseLocal(t) > parseLocal(m.times[i - 1]!)),
  );
  const canApprove =
    !!m.to && (!!poc?.email || m.checked) && !dirty && !blocked && timesOk && !Object.values(gateBusy).some(Boolean);

  const approve = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-passcode": pass,
          ...keyHeaders(),
        },
        body: JSON.stringify({
          company: run.research?.name || run.company,
          poc,
          to: m.to.trim(),
          to_checked: m.checked,
          subject: run.seq!.subjects[m.subject],
          steps: m.bodies.map((body, i) => ({
            body,
            send_at_iso: new Date(
              m.sendNow && i === 0 ? Date.now() : parseLocal(m.times[i]!),
            ).toISOString(),
            gate: { route: m.gates[i]!.route, composite: m.gates[i]!.composite },
          })),
          linkedin: ["linkedin1", "linkedin2", "linkedin3"]
            .map((k) => run.seq!.items[k]?.text)
            .filter(Boolean),
          send_now: !!m.sendNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRun({ ...run, approve: { ...m, done: data.sequence } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Approve & schedule</h3>
      <p className="mute">
        One approval covers the whole sequence. Emails go from raghav.r@onplusone.in, plain text. If
        they reply, nothing more is sent. Approve the whole sequence once; Email 1–3 go on schedule and
        stop if they reply.
      </p>
      <span className="lbl">To</span>
      <input
        value={m.to}
        onChange={(e) => setRun({ ...run, approve: { ...m, to: e.target.value, checked: false } })}
        placeholder="name@company.com"
      />
      {poc?.email_guess && m.to.trim().toLowerCase() === poc.email_guess.toLowerCase() ? (
        <div className="mute">
          This address is a guess from the pattern {poc.pattern_example}, not verified.
        </div>
      ) : (
        <div className="mute">This address isn&apos;t verified on any source page unless shown earlier.</div>
      )}
      {!poc?.email && (
        <label className="mute">
          <input
            type="checkbox"
            checked={m.checked}
            onChange={(e) => setRun({ ...run, approve: { ...m, checked: e.target.checked } })}
          />{" "}
          I checked this address
        </label>
      )}
      <span className="lbl" style={{ display: "block", marginTop: 12 }}>
        Subject
      </span>
      {run.seq!.subjects.map((s, i) => (
        <label key={i} className="row">
          <input
            type="radio"
            checked={m.subject === i}
            onChange={() => setRun({ ...run, approve: { ...m, subject: i } })}
          />
          <span className="grow">{s}</span>
        </label>
      ))}
      {m.bodies.map((body, i) => (
        <div key={i} style={{ marginTop: 12 }}>
          <span className="lbl grow">
            Email {i + 1}
            {i ? ` · reply in the same thread ("Re: ${run.seq!.subjects[m.subject]}")` : ""}
          </span>
          <textarea
            value={body}
            onChange={(e) => {
              const bodies = [...m.bodies];
              bodies[i] = e.target.value;
              setRun({ ...run, approve: { ...m, bodies } });
            }}
            onBlur={() => reGate(i, m.bodies[i]!)}
          />
          <div className="mute">
            Send at{" "}
            <input
              type="datetime-local"
              value={m.times[i]}
              onChange={(e) => {
                const times = [...m.times];
                times[i] = e.target.value;
                setRun({ ...run, approve: { ...m, times } });
              }}
            />
            {gateBusy[i]
              ? " · re-scoring…"
              : body !== m.gated[i]
                ? " · edit pending re-score"
                : ` · ${m.gates[i]?.route}${m.gates[i]?.composite != null ? ` ${m.gates[i]?.composite}` : ""}`}
          </div>
        </div>
      ))}
      {error && <p className="err">{error}</p>}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" disabled={!canApprove || busy} onClick={approve}>
          {busy ? "Saving…" : "Approve sequence"}
        </button>
        <button className="btn ghost" onClick={() => setRun({ ...run, approve: { ...m, open: false } })}>
          Close
        </button>
      </div>
    </div>
  );
}
