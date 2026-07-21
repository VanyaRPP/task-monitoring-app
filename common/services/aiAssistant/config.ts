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
 */

export type ProviderId = 'google' | 'groq'

interface ProviderConfig {
  /** Human label for logs/errors. */
  label: string
  /** Env var that holds this provider's API key. */
  apiKeyEnv: string
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
    model: 'gemini-flash-latest',
    create: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
  },
  // Groq — generous free tier and strong tool-calling on Llama 3.3 70B.
  groq: {
    label: 'Groq',
    apiKeyEnv: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
    create: (apiKey, model) => createGroq({ apiKey })(model),
  },
}

/** Active provider id, from `AI_PROVIDER` env (defaults to google). */
export function getActiveProviderId(): ProviderId {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (raw && raw in PROVIDERS) {
    return raw as ProviderId
  }
  return 'google'
}

export function getActiveProvider(): ProviderConfig & { id: ProviderId } {
  const id = getActiveProviderId()
  return { id, ...PROVIDERS[id] }
}

/**
 * Resolves the LanguageModel for the active provider. Throws a clear error if
 * the provider's API key is missing so the route can return a helpful 500.
 */
export function getModel(): LanguageModel {
  const provider = getActiveProvider()
  const apiKey = process.env[provider.apiKeyEnv]?.trim()
  if (!apiKey) {
    throw new Error(
      `AI provider "${provider.label}" is selected but ${provider.apiKeyEnv} is missing or empty.`
    )
  }
  return provider.create(apiKey, provider.model)
}

// Upper bound on reasoning/tool steps per user message. With tools enabled the
// SDK stops after the first step by default (`stepCountIs(1)`), which would end
// the turn right after a tool call without a textual answer. Allowing a few
// steps lets the model call a tool and then reply based on its result.
export const AI_MAX_STEPS = 5
