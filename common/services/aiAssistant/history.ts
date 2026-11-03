import type { UIMessage } from 'ai'

/**
 * The history as the chat model gets it: a preview tool's `draft` dropped from
 * its output.
 *
 * A draft is the full payload the widget opens a form with (an invoice with
 * every line, provider and receiver). The model never needs it again - each
 * tool also returns a `summary` for the reply - yet the whole history is resent
 * on every step, so old drafts would only grow the token bill.
 */
export function withoutDrafts(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: (message.parts ?? []).map((part) => {
      const output = (part as { output?: unknown }).output
      if (
        !part.type.startsWith('tool-') ||
        !output ||
        typeof output !== 'object' ||
        !('draft' in output)
      ) {
        return part
      }
      const { draft: _draft, ...rest } = output as Record<string, unknown>
      return { ...part, output: rest } as typeof part
    }),
  }))
}

/** How many of the latest chat messages the model still gets. */
export const HISTORY_LIMIT = 12

/**
 * The tail of a long chat, starting at a user message. The whole history is
 * resent with every step, so an hour-long chat alone would outgrow Groq's
 * 8K tokens per minute; older turns rarely matter to the next request.
 */
export function recentMessages(
  messages: UIMessage[],
  limit = HISTORY_LIMIT
): UIMessage[] {
  if (messages.length <= limit) return messages
  const tail = messages.slice(-limit)
  const firstUser = tail.findIndex((message) => message.role === 'user')
  return firstUser > 0 ? tail.slice(firstUser) : tail
}
