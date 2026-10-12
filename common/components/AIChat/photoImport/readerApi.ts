import type { IDocumentSurvey } from '@common/services/aiAssistant/documents/types'

/**
 * Calls to /api/documents/read, one vision step each. Plain `fetch` rather
 * than RTK Query: these are steps of a long, paced job, not cached data.
 */

/**
 * `ok` with `data`, or why not: `rate` (wait `retryAfter` seconds), `too-long`
 * (cut the strip smaller), `unavailable` (no page reader - read in strips) or
 * `error` (with a `message`).
 */
export interface ReadOutcome<T> {
  ok: boolean
  data?: T
  kind?: 'rate' | 'too-long' | 'unavailable' | 'error'
  retryAfter?: number
  message?: string
}

const DEFAULT_RETRY_AFTER = 30

async function read<T>(body: Record<string, unknown>): Promise<ReadOutcome<T>> {
  let response: Response
  try {
    response = await fetch('/api/documents/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, kind: 'error', message: 'Немає зʼєднання з сервером' }
  }

  const json = await response.json().catch(() => ({}))

  if (response.ok) return { ok: true, data: json.data as T }
  if (response.status === 429) {
    const retryAfter = Number(json.retryAfter)
    return {
      ok: false,
      kind: 'rate',
      retryAfter:
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter
          : DEFAULT_RETRY_AFTER,
    }
  }
  if (response.status === 422) return { ok: false, kind: 'too-long' }
  if (response.status === 409) return { ok: false, kind: 'unavailable' }

  return {
    ok: false,
    kind: 'error',
    message: json.message || 'Не вдалося прочитати фото',
  }
}

export const surveyPhoto = (image: string) =>
  read<IDocumentSurvey>({ step: 'survey', image })

export const readStrip = (image: string, columns?: string[]) =>
  read<{ columns: string[]; rows: string[] }>({
    step: 'rows',
    image,
    ...(columns?.length ? { columns } : {}),
  })

/** The whole photo at once - the page reader's step, tried first. */
export interface IPageReadResult extends IDocumentSurvey {
  columns: string[]
  rows: string[]
}

export const readPage = (image: string) =>
  read<IPageReadResult>({ step: 'page', image })
