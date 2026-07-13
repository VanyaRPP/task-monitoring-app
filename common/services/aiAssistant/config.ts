/**
 * Central configuration for the AI assistant.
 *
 * Kept separate from the API route so the model / provider can be swapped in
 * one place without touching request-handling logic. See the feature plan and
 * `prompt.ts` for the assistant's behaviour.
 */

// Google Generative AI model id. `gemini-flash-latest` is an alias that Google
// maps to the current stable Flash model, so it stays current without code
// changes. It was chosen over pinned ids (`gemini-2.0-flash`, `-2.0-flash-lite`)
// because those return free-tier quota = 0 (HTTP 429) for this project's
// region, whereas `gemini-flash-latest` responds and supports function-calling.
export const AI_MODEL = 'gemini-flash-latest'

// Upper bound on reasoning/tool steps per user message. With tools enabled the
// SDK stops after the first step by default (`stepCountIs(1)`), which would end
// the turn right after a tool call without a textual answer. Allowing a few
// steps lets the model call a tool and then reply based on its result.
export const AI_MAX_STEPS = 5

// Env var read by the `@ai-sdk/google` provider for auth.
export const AI_API_KEY_ENV = 'GOOGLE_GENERATIVE_AI_API_KEY'
