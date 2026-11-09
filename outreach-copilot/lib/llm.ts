import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import type { KeysFromHeaders } from "./types";

export type ModelMeta = {
  models: string[];
  claude_down: string | null;
};

function anthropicModel(key: string, id = "claude-sonnet-4-5") {
  return createAnthropic({ apiKey: key })(id);
}

function moonshotModel(key: string, id = "kimi-k2-turbo-preview") {
  return createOpenAI({
    apiKey: key,
    baseURL: "https://api.moonshot.ai/v1",
    name: "moonshot",
  })(id);
}

function openrouterModel(key: string, id: string) {
  return createOpenAI({
    apiKey: key,
    baseURL: "https://openrouter.ai/api/v1",
    name: "openrouter",
  })(id);
}

export async function withModels<T>(
  keys: KeysFromHeaders,
  run: (ctx: {
    generate: typeof generateText;
    generateObject: typeof generateObject;
    model: ReturnType<typeof anthropicModel>;
    label: string;
  }) => Promise<T>,
): Promise<{ result: T; meta: ModelMeta }> {
  const models: string[] = [];
  let claude_down: string | null = null;

  if (keys.anthropic) {
    try {
      const result = await run({
        generate: generateText,
        generateObject,
        model: anthropicModel(keys.anthropic),
        label: "claude",
      });
      models.push("claude");
      return { result, meta: { models, claude_down } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/credit balance|authentication|x-api-key|api key|Claude:/i.test(msg)) {
        claude_down = "credit";
      } else {
        claude_down = "error";
      }
    }
  } else {
    claude_down = "missing";
  }

  if (keys.moonshot) {
    const result = await run({
      generate: generateText,
      generateObject,
      model: moonshotModel(keys.moonshot),
      label: "kimi",
    });
    models.push("kimi");
    return { result, meta: { models, claude_down } };
  }

  if (keys.openrouter) {
    const result = await run({
      generate: generateText,
      generateObject,
      model: openrouterModel(keys.openrouter, "anthropic/claude-sonnet-4.5"),
      label: "openrouter",
    });
    models.push("openrouter");
    return { result, meta: { models, claude_down } };
  }

  throw new Error(
    "Research needs a Claude key (or Kimi / OpenRouter fallback). Add one in Profile → API keys.",
  );
}

export async function liveWebCheck(
  keys: KeysFromHeaders,
  prompt: string,
): Promise<{ refused?: boolean; p?: number; text?: string; citations?: { url: string; note?: string }[] }> {
  if (!keys.openrouter) return { refused: true };
  try {
    const { text } = await generateText({
      model: openrouterModel(keys.openrouter, "perplexity/sonar"),
      prompt,
      maxOutputTokens: 400,
    });
    return { p: 0.7, text, citations: [] };
  } catch {
    return { refused: true };
  }
}

export const researchSchema = z.object({
  name: z.string(),
  summary: z.string(),
  takeaway: z.string().optional(),
  fit_flags: z.array(z.string()).optional(),
  signals: z.array(
    z.object({
      date: z.string(),
      type: z.string(),
      fact: z.string(),
      url: z.string(),
      sensitive: z.boolean().optional(),
      sensitive_why: z.string().optional(),
    }),
  ),
  best_hook: z.number().nullable().optional(),
  hook_reason: z.string().optional(),
  open_roles: z
    .array(
      z.object({
        date: z.string(),
        type: z.string(),
        fact: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
});

export const thesesSchema = z.object({
  theses: z.array(
    z.object({
      label: z.string(),
      title: z.string(),
      org_signal: z.string(),
      proof: z.string(),
      why: z.string(),
      watch_out: z.string(),
    }),
  ),
});

export const peopleSchema = z.object({
  people: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      source_url: z.string(),
      linkedin_url: z.string().optional(),
      email: z.string().optional(),
      email_guess: z.string().optional(),
      pattern_example: z.string().optional(),
      pattern_source_url: z.string().optional(),
    }),
  ),
  recommend: z.number(),
  recommend_reason: z.string().optional(),
});

export const questionsSchema = z.object({
  questions: z.array(z.string()).min(3).max(6),
});

export const draftSchema = z.object({
  subjects: z.array(z.string()).min(2).max(5),
  email1: z.string(),
  email2: z.string(),
  email3: z.string(),
  linkedin1: z.string(),
  linkedin2: z.string().optional(),
  linkedin3: z.string().optional(),
  opening_signal_facts: z.array(z.string()).optional(),
  proofs: z.array(z.array(z.string())).optional(),
});
