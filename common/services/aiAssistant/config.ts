import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import type { LanguageModel } from 'ai'

/**
 * Central configuration for the AI assistant.
 *
 * The assistant can run on different LLM providers without touching the API
 * route: each entry in `PROVIDERS` bundles a provider factory, a default model,
 * and the env var holding its API key. The active provider is chosen by the
 * `AI_PROVIDER` env var (defaults to `google`), so switching — e.g. to dodge
 * Gemini free-tier limits — is a one-line `.env` change plus a restart, no code
 * edit. Add a new provider by adding one entry here.
 *
 * Each provider's model id can also be overridden via its `modelEnv` var
 * (`GOOGLE_MODEL` / `GROQ_MODEL`). Providers retire model ids without notice —
 * Groq dropped the whole Llama 3.x family, which is why the default here had to
 * change — and the failure is a hard 404 that takes the assistant down. There is
 * deliberately no automatic fallback to an "older version": ids are not a
 * version ladder (there was no llama-3.1 to fall back to either), and silently
 * downgrading would hide a degraded model for months. The override exists so a
 * retirement can be fixed by editing an env var instead of shipping a deploy.
 */

export type ProviderId = 'google' | 'groq'

interface ProviderConfig {
  /** Human label for logs/errors. */
  label: string
  /** Env var that holds this provider's API key. */
  apiKeyEnv: string
  /** Env var that overrides `model`, so a retired id is a config change. */
  modelEnv: string
  /** Default model id for this provider (good tool-calling for invoice flow). */
  model: string
  /** Env var that overrides `visionModel`. */
  visionModelEnv: string
  /**
   * Model that reads document photos. Kept apart from `model` because the best
   * free chat model is not always able to see images (gpt-oss-120b is text-only).
   */
  visionModel: string
  /** Builds a LanguageModel for `streamText`, given the resolved API key. */
  create: (apiKey: string, model: string) => LanguageModel
}

const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  // Google Gemini. `gemini-flash-latest` tracks the current stable Flash model.
  // Free-tier RPD/quota in some regions makes this unreliable — see `groq`.
  google: {
    label: 'Google Gemini',
    apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY',
    modelEnv: 'GOOGLE_MODEL',
    model: 'gemini-flash-latest',
    visionModelEnv: 'GOOGLE_VISION_MODEL',
    visionModel: 'gemini-flash-latest',
    create: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
  },
  // Groq — generous free tier and strong tool-calling. gpt-oss-120b is the
  // largest general model Groq still serves; the previous default
  // (llama-3.3-70b-versatile) was retired along with the rest of Llama 3.x.
  // Avoid the `groq/compound*` ids here: they run their own built-in tools,
  // which collide with the assistant's own tool set.
  // Qwen3.8 is the only Groq model that takes images. On the free tier it
  // rejects any request whose max output exceeds 1000 tokens (OTPM limit), so
  // every call to it must pass an explicit cap - see VISION_MAX_OUTPUT_TOKENS.
  groq: {
    label: 'Groq',
    apiKeyEnv: 'GROQ_API_KEY',
    modelEnv: 'GROQ_MODEL',
    model: 'openai/gpt-oss-120b',
    visionModelEnv: 'GROQ_VISION_MODEL',
    visionModel: 'qwen/qwen3.8-27b',
    create: (apiKey, model) => createGroq({ apiKey })(model),
  },
}

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]

function hasApiKey(config: ProviderConfig): boolean {
  return !!process.env[config.apiKeyEnv]?.trim()
}

/**
 * Active provider id.
 *
 * An explicit `AI_PROVIDER` always wins, even when its key is missing, so a
 * deliberate choice fails loudly instead of quietly running on the other
 * provider. With `AI_PROVIDER` unset we pick the first provider that actually
 * has its API key configured: hardcoding `google` here meant an environment
 * that had only configured Groq still reported `Google Gemini is selected`,
 * naming a provider nobody had chosen. Falling back to the first id keeps the
 * error message deterministic when nothing at all is configured.
 */
export function getActiveProviderId(): ProviderId {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (raw && raw in PROVIDERS) {
    return raw as ProviderId
  }
  return PROVIDER_IDS.find((id) => hasApiKey(PROVIDERS[id])) ?? PROVIDER_IDS[0]
}

export function getActiveProvider(): ProviderConfig & { id: ProviderId } {
  const id = getActiveProviderId()
  const config = PROVIDERS[id]
  return {
    id,
    ...config,
    model: process.env[config.modelEnv]?.trim() || config.model,
    visionModel:
      process.env[config.visionModelEnv]?.trim() || config.visionModel,
  }
}

function requireApiKey(provider: ProviderConfig): string {
  const apiKey = process.env[provider.apiKeyEnv]?.trim()
  if (!apiKey) {
    const known = PROVIDER_IDS.map(
      (id) => `${id} -> ${PROVIDERS[id].apiKeyEnv}`
    ).join(', ')
    throw new Error(
      `AI provider "${provider.label}" is selected but ${provider.apiKeyEnv} is missing or empty. ` +
        `Set ${provider.apiKeyEnv}, or set AI_PROVIDER to a provider whose key is configured (${known}).`
    )
  }
  return apiKey
}

/**
 * Resolves the LanguageModel for the active provider. Throws a clear error if
 * the provider's API key is missing so the route can return a helpful 500.
 */
export function getModel(): LanguageModel {
  const provider = getActiveProvider()
  return provider.create(requireApiKey(provider), provider.model)
}

/** The active provider's image-capable model, for reading document photos. */
export function getVisionModel(): LanguageModel {
  const provider = getActiveProvider()
  return provider.create(requireApiKey(provider), provider.visionModel)
}

// Output cap for a photo read. Groq's free tier refuses a request that merely
// ASKS for more than 1000 output tokens per minute, so this is the ceiling
// there. About 45 tokens per table row, so a sheet of ~20 months fits; a
// longer one is cut off and flagged rather than failing.
export const VISION_MAX_OUTPUT_TOKENS = 1000

// Upper bound on reasoning/tool steps per user message. With tools enabled the
// SDK stops after the first step by default (`stepCountIs(1)`), which would end
// the turn right after a tool call without a textual answer. Allowing a few
// steps lets the model call a tool and then reply based on its result.
export const AI_MAX_STEPS = 5

/**
 * The model that reads a whole statement photo in one call - first choice
 * for photos, ahead of Groq's strip-by-strip reading.
 *
 * Gemini 3.5 Flash-Lite: on synthetic copies of the HOA printouts (46 rows,
 * 8 columns, phone-photo quality, deskewed) it read 5 of 5 sheets without a
 * single wrong cell, at about $0.006 a sheet - the cheapest model that did.
 * 3.1 Flash-Lite ($0.004) missed 3 cells and building numbers; 3.8 Flash was
 * as exact at $0.01 and often overloaded. Its output cap (64K) fits a page,
 * so there are no strips and no seams, where most misreads came from.
 *
 * Paid use needs billing on the Google project; without it the key runs on
 * the free tier, where Google may use the photos for training.
 *
 * `PHOTO_READER=strips` turns it off (Groq strips only); `GOOGLE_PHOTO_MODEL`
 * swaps the model. `null` without a Google key - the photo import then reads
 * in strips as before.
 */
export const DEFAULT_PHOTO_MODEL = 'gemini-3.5-flash-lite'
export const PAGE_MAX_OUTPUT_TOKENS = 8192

export function getPageReader(): {
  label: string
  model: LanguageModel
} | null {
  if (process.env.PHOTO_READER?.trim().toLowerCase() === 'strips') return null

  const apiKey = process.env[PROVIDERS.google.apiKeyEnv]?.trim()
  if (!apiKey) return null

  const modelId = process.env.GOOGLE_PHOTO_MODEL?.trim() || DEFAULT_PHOTO_MODEL
  return {
    label: `Google ${modelId}`,
    model: PROVIDERS.google.create(apiKey, modelId),
  }
}
