import type { IDocumentSurvey } from '@common/services/aiAssistant/documents/types'
import {
  IReadStrip,
  IStrip,
  planRereads,
  planStrips,
  splitStrip,
  suspectPeriods,
} from '@common/services/aiAssistant/documents/strips'
import { periodKey } from '@utils/debt-calculation/months'
import {
  checkStatement,
  IStatementIssue,
  IStatementRow,
  mergeStatementRows,
  parseStatementCells,
} from '@utils/debt-calculation/statement'
import type { IReadPhoto } from './grouping'
import type { IPageReadResult, ReadOutcome } from './readerApi'

export type PhotoStatus =
  'queued' | 'reading' | 'done' | 'unrecognized' | 'failed'

export interface IPhotoProgress {
  status: PhotoStatus
  stripsDone: number
  stripsTotal: number
  error?: string
}

/** Everything the loop touches outside itself - the browser and a test script plug in their own. */
export interface IReadPhotoDeps {
  /** The whole photo at once (Gemini). Tried first when given. */
  readPage?: (image: string) => Promise<ReadOutcome<IPageReadResult>>
  survey: (image: string) => Promise<ReadOutcome<IDocumentSurvey>>
  readStrip: (
    image: string,
    columns?: string[]
  ) => Promise<ReadOutcome<{ columns: string[]; rows: string[] }>>
  crop: (image: string, strip: IStrip) => Promise<string>
  /** Sits out a rate limit of `seconds`. */
  wait: (seconds: number) => Promise<void>
  onProgress: (patch: Partial<IPhotoProgress>) => void
  isCancelled: () => boolean
}

/** Rate-limit pauses a single step may sit through before giving up. */
const MAX_RATE_WAITS = 6
/** Tries at reading the column titles before a photo is given up on. */
const MAX_TITLE_READS = 2
/** Passes of targeted re-reads after the main strips. */
const MAX_REREAD_ROUNDS = 2
/** Whole-page reads: a second one only when the first left months in doubt. */
const MAX_PAGE_READS = 2

type PhotoResult = IReadPhoto & { survey: IDocumentSurvey }

/**
 * Reads one statement photo.
 *
 * First choice is the page reader (see `readPage`): the whole photo in one
 * call, and once more if the checks left months missing or not adding up -
 * the merge keeps whichever copy adds up. Only when it is not set up, out of
 * service, or cannot make out the columns, does the photo go the free way:
 * survey, then strips, then targeted re-reads of whatever came out missing
 * or not adding up.
 *
 * A strip that held too many rows for one answer is halved and retried; a
 * rate limit pauses the loop; the column titles come from the top strip and
 * are handed to the rest. `null` when the photo is not a statement or could
 * not be read - its progress says which.
 */
export async function readStatementPhoto(
  photo: { name: string; url: string },
  deps: IReadPhotoDeps
): Promise<PhotoResult | null> {
  const paced = async <T>(
    call: () => Promise<ReadOutcome<T>>
  ): Promise<ReadOutcome<T>> => {
    for (let attempt = 0; attempt <= MAX_RATE_WAITS; attempt += 1) {
      const outcome = await call()
      if (outcome.ok || outcome.kind !== 'rate' || deps.isCancelled()) {
        return outcome
      }
      await deps.wait(outcome.retryAfter)
    }
    return {
      ok: false,
      kind: 'error',
      message: 'Ліміт безкоштовного тарифу так і не звільнився',
    }
  }

  deps.onProgress({ status: 'reading' })

  /**
   * The page reader's go at it: the result, `null` for "not a statement", or
   * `undefined` to fall back to strips.
   */
  const viaPage = async (): Promise<PhotoResult | null | undefined> => {
    const pages: IStatementRow[][] = []
    const found: IStatementIssue[] = []
    let first: IPageReadResult | undefined

    for (let attempt = 0; attempt < MAX_PAGE_READS; attempt += 1) {
      if (deps.isCancelled()) break
      deps.onProgress({ stripsTotal: attempt + 1, stripsDone: attempt })

      const outcome = await paced(() => deps.readPage(photo.url))
      if (!outcome.ok) break

      const page = outcome.data
      if (page.documentType !== 'debtMonthlyStatement') {
        if (first) break
        deps.onProgress({ status: 'unrecognized' })
        return null
      }

      const parsed = parseStatementCells(page.columns, page.rows)
      if (parsed.issues.some(({ kind }) => kind === 'columns')) break

      first = first ?? page
      pages.push(parsed.rows)
      found.push(...parsed.issues)
      deps.onProgress({ stripsDone: attempt + 1 })

      const merged = mergeStatementRows(pages)
      if (suspectPeriods(merged, checkStatement(merged).issues).length === 0) {
        break
      }
    }

    if (!first) return undefined

    // A row the first read could not make out may have come through on the
    // second; its complaint goes with it.
    const read = new Set(
      mergeStatementRows(pages).map(
        ({ year, month }) => `${year}-${String(month).padStart(2, '0')}`
      )
    )
    deps.onProgress({ status: 'done', stripsTotal: pages.length })

    return {
      jobId: '',
      name: photo.name,
      header: first.header,
      candidates: first.candidates,
      suggestedCompanyId: first.suggestedCompanyId,
      strips: pages,
      issues: found.filter(
        ({ kind, period }) =>
          kind !== 'unreadable' || !period || !read.has(period)
      ),
      survey: first,
    }
  }

  if (deps.readPage) {
    const page = await viaPage()
    if (page !== undefined) return page
    deps.onProgress({ stripsDone: 0, stripsTotal: 0 })
  }

  const survey = await paced(() => deps.survey(photo.url))
  if (!survey.ok) {
    deps.onProgress({
      status: 'failed',
      error: survey.kind === 'error' ? survey.message : undefined,
    })
    return null
  }
  if (survey.data.documentType !== 'debtMonthlyStatement') {
    deps.onProgress({ status: 'unrecognized' })
    return null
  }

  const queue = planStrips(survey.data.rowCount)
  const strips: IStatementRow[][] = []
  const reads: IReadStrip[] = []
  const issues: IStatementIssue[] = []
  let columns: string[] | undefined
  let titleReads = 0
  let done = 0
  deps.onProgress({ stripsTotal: queue.length })

  const readQueue = async (): Promise<'ok' | 'failed'> => {
    while (queue.length > 0 && !deps.isCancelled()) {
      const strip = queue.shift()
      const image = await deps.crop(photo.url, strip)
      const outcome = await paced(() => deps.readStrip(image, columns))

      if (!outcome.ok) {
        const halves = outcome.kind === 'too-long' ? splitStrip(strip) : null
        if (halves) {
          queue.unshift(...halves)
        } else {
          issues.push({
            kind: 'unreadable',
            message: `Частину фото «${photo.name}» не вдалося прочитати — перевірте місяці біля пропуску.`,
          })
          done += 1
        }
        deps.onProgress({ stripsDone: done, stripsTotal: done + queue.length })
        continue
      }

      const titles = columns ?? outcome.data.columns
      const parsed = parseStatementCells(titles, outcome.data.rows)

      if (!columns && parsed.issues.some(({ kind }) => kind === 'columns')) {
        titleReads += 1
        if (titleReads < MAX_TITLE_READS) {
          // Same strip again: the titles are read afresh each time.
          queue.unshift(strip)
          continue
        }
        deps.onProgress({ status: 'failed', error: parsed.issues[0].message })
        return 'failed'
      }

      columns = titles
      strips.push(parsed.rows)
      reads.push({ strip, periods: parsed.rows.map(periodKey) })
      issues.push(...parsed.issues)
      done += 1
      deps.onProgress({ stripsDone: done, stripsTotal: done + queue.length })
    }
    return 'ok'
  }

  if ((await readQueue()) === 'failed') return null

  // Rows cut by a strip edge come out missing or garbled; a narrow strip
  // centred on them usually reads them whole, and the merge keeps whichever
  // copy adds up.
  for (let round = 0; round < MAX_REREAD_ROUNDS; round += 1) {
    if (deps.isCancelled()) break
    const merged = mergeStatementRows(strips)
    const suspects = suspectPeriods(merged, checkStatement(merged).issues)
    if (suspects.length === 0) break

    queue.push(...planRereads(reads, suspects))
    deps.onProgress({ stripsTotal: done + queue.length })
    if ((await readQueue()) === 'failed') return null
  }

  deps.onProgress({ status: 'done' })

  return {
    jobId: '',
    name: photo.name,
    header: survey.data.header,
    candidates: survey.data.candidates,
    suggestedCompanyId: survey.data.suggestedCompanyId,
    strips,
    issues,
    survey: survey.data,
  }
}
