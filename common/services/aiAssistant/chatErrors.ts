// The fields of the SDK's APICallError this reads. Duck-typed rather than
// imported: `ai` pulls in Web Streams, which tests mock away.
interface ApiErrorLike {
  statusCode?: number
  message?: string
  responseBody?: string
}

/**
 * What the chat tells the user when the model call fails.
 *
 * The provider's own errors are English and technical, and with no handler
 * the stream only says "An error occurred". The usual failure on Groq's free
 * tier is its tokens-per-minute limit, which a retry within the same minute
 * cannot fix - so the user is told to wait, or to send less.
 */
export function describeChatError(error: unknown): string {
  const apiError = findApiError(error)
  const text = `${apiError?.message ?? ''} ${apiError?.responseBody ?? ''}`

  if (apiError?.statusCode === 413 || /request too large/i.test(text)) {
    return 'Запит завеликий для ліміту моделі. Надішли список частинами або почни нову розмову.'
  }
  if (
    apiError?.statusCode === 429 ||
    /rate.?limit|tokens per minute/i.test(text)
  ) {
    return 'Вичерпано хвилинний ліміт моделі. Спробуй ще раз за хвилину.'
  }
  return 'Не вдалося отримати відповідь асистента. Спробуй ще раз.'
}

/** The provider's error: the one thrown, or inside a retry or a cause. */
function findApiError(error: unknown, depth = 0): ApiErrorLike | undefined {
  if (!error || typeof error !== 'object' || depth > 5) return undefined
  const value = error as ApiErrorLike & { lastError?: unknown; cause?: unknown }
  if (typeof value.statusCode === 'number') return value
  return (
    findApiError(value.lastError, depth + 1) ??
    findApiError(value.cause, depth + 1) ??
    (value.message ? value : undefined)
  )
}
