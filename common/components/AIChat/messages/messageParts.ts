import type { UIMessage } from '@ai-sdk/react'
import type { FileUIPart } from 'ai'

export const WELCOME_MESSAGE_ID = 'welcome'

export const getMessageText = (message: UIMessage): string =>
  (message.parts ?? [])
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text'
    )
    .map((part) => part.text)
    .join('')

export const isPhoto = (part: UIMessage['parts'][number]): part is FileUIPart =>
  part.type === 'file' && part.mediaType?.startsWith('image/')

/** Tools whose output opens a prefilled form the user can save. */
const DRAFT_TOOL_TYPES = new Set([
  'tool-previewInvoice',
  'tool-previewCredit',
  'tool-previewExpenses',
  'tool-previewCompany',
  'tool-previewStreet',
  'tool-previewDomain',
  'tool-previewService',
])

/**
 * An answer that opened a draft form must not be regenerated: the new answer
 * would open the form again and the user could save the same record twice.
 */
export const producedDraft = (message: UIMessage): boolean =>
  (message.parts ?? []).some(
    (part) =>
      DRAFT_TOOL_TYPES.has(part.type) &&
      !!(part as { output?: { draft?: unknown } }).output?.draft
  )

/** Server errors arrive as the raw response body, e.g. `{"error":"..."}`. */
export const describeChatError = (error: Error | undefined): string => {
  const raw = error?.message ?? ''
  if (/unauthorized|401/i.test(raw)) {
    return 'Сесія завершилася. Оновіть сторінку та увійдіть знову.'
  }
  if (/forbidden|403/i.test(raw)) {
    return 'Немає доступу до AI-помічника.'
  }
  // getModel() throws this when the provider's key is not configured.
  if (/API_KEY is missing/i.test(raw)) {
    return 'AI-помічник не налаштований на сервері (немає API-ключа). Зверніться до адміністратора.'
  }
  if (/failed to fetch|network/i.test(raw)) {
    return "Немає з'єднання з сервером. Перевірте інтернет і спробуйте ще раз."
  }
  return 'Не вдалося отримати відповідь. Спробуйте ще раз.'
}
