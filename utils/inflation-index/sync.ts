import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import InflationIndex from '@modules/models/InflationIndex'
import { formatPeriod, periodKey } from '@utils/debt-calculation/months'
import { insertMissingIndexes } from './insert-missing'
import { filterByRange, reconcileSources } from './reconcile'
import {
  BUHGALTER_SOURCE,
  BUHGALTER_URL,
  parseBuhgalter,
} from './sources/buhgalter'
import { MINFIN_SOURCE, MINFIN_URL, parseMinfin } from './sources/minfin'
import type { IIndexMismatch, IIndexRejected, IIndexSource } from './types'

export interface IIndexSourceConfig {
  name: string
  url: string
  parse: (html: string) => IInflationIndexInput[]
}

export const SOURCES: IIndexSourceConfig[] = [
  { name: MINFIN_SOURCE, url: MINFIN_URL, parse: parseMinfin },
  { name: BUHGALTER_SOURCE, url: BUHGALTER_URL, parse: parseBuhgalter },
]

export interface IFailedSource {
  source: string
  error: string
}

export interface ISyncReport {
  added: IInflationIndexInput[]
  mismatched: IIndexMismatch[]
  rejected: IIndexRejected[]
  failedSources: IFailedSource[]
}

const FETCH_TIMEOUT_MS = 20_000

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; inflation-index-sync)',
      Accept: 'text/html',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.text()
}

const pickCandidates = (
  items: IInflationIndexInput[],
  firstKey: number,
  storedKeys: Set<number>
): IInflationIndexInput[] =>
  items.filter((item) => {
    const key = periodKey(item)
    return key >= firstKey && !storedKeys.has(key)
  })

export async function syncInflationIndexes(
  sources: IIndexSourceConfig[] = SOURCES,
  fetchPage: (url: string) => Promise<string> = fetchHtml
): Promise<ISyncReport> {
  const stored = await InflationIndex.find({}, { year: 1, month: 1 }).lean()
  if (stored.length === 0) {
    throw new Error(
      'Довідник ІСЦ порожній: спершу запустіть scripts/seed-inflation-indexes.ts'
    )
  }
  const storedKeys = new Set(stored.map(periodKey))
  const firstKey = Math.min(...storedKeys)

  const failedSources: IFailedSource[] = []
  const parsed: IIndexSource[] = []

  const results = await Promise.allSettled(
    sources.map(async ({ url, parse }) => parse(await fetchPage(url)))
  )
  results.forEach((result, i) => {
    const { name } = sources[i]
    if (result.status === 'fulfilled') {
      parsed.push({
        name,
        items: pickCandidates(result.value, firstKey, storedKeys),
      })
    } else {
      const { reason } = result
      failedSources.push({
        source: name,
        error: reason instanceof Error ? reason.message : String(reason),
      })
    }
  })

  const { agreed, mismatched } = reconcileSources(parsed)
  const { valid, rejected } = filterByRange(agreed)
  const added = await insertMissingIndexes(valid)

  return { added, mismatched, rejected, failedSources }
}

export const hasProblems = (report: ISyncReport): boolean =>
  report.failedSources.length > 0 ||
  report.rejected.length > 0 ||
  report.mismatched.some(({ reason }) => reason === 'conflict')

const listPeriods = (items: IInflationIndexInput[]) =>
  items.map((item) => `${formatPeriod(item)}=${item.value}`).join(', ')

export function formatSyncReport(report: ISyncReport): string {
  const { added, mismatched, rejected, failedSources } = report
  const lines = [
    `[cron:monthly] ІСЦ: додано ${added.length}, розбіжностей ${mismatched.length}, відкинуто ${rejected.length}, джерел з помилкою ${failedSources.length}`,
  ]

  if (added.length) lines.push(`  додано: ${listPeriods(added)}`)
  mismatched.forEach(({ reason, values, ...period }) => {
    const readings = values.map((v) => `${v.source}=${v.value}`).join(', ')
    lines.push(`  ${reason} ${formatPeriod(period)}: ${readings}`)
  })
  if (rejected.length) {
    lines.push(`  поза діапазоном 90–120: ${listPeriods(rejected)}`)
  }
  failedSources.forEach(({ source, error }) => {
    lines.push(`  джерело ${source} недоступне: ${error}`)
  })

  return lines.join('\n')
}
