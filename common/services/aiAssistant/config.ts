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
    create: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
  },
  // Groq — generous free tier and strong tool-calling. gpt-oss-120b is the
  // largest general model Groq still serves; the previous default
  // (llama-3.3-70b-versatile) was retired along with the rest of Llama 3.x.
  // Avoid the `groq/compound*` ids here: they run their own built-in tools,
  // which collide with the assistant's own tool set.
  groq: {
    label: 'Groq',
    apiKeyEnv: 'GROQ_API_KEY',
    modelEnv: 'GROQ_MODEL',
    model: 'openai/gpt-oss-120b',
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
  }
}

/**
 * Resolves the LanguageModel for the active provider. Throws a clear error if
 * the provider's API key is missing so the route can return a helpful 500.
 */
export function getModel(): LanguageModel {
  const provider = getActiveProvider()
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
  return provider.create(apiKey, provider.model)
}

// Upper bound on reasoning/tool steps per user message. With tools enabled the
// SDK stops after the first step by default (`stepCountIs(1)`), which would end
// the turn right after a tool call without a textual answer. Allowing a few
// steps lets the model call a tool and then reply based on its result.
export const AI_MAX_STEPS = 5
