import type {
  ICompanyCandidate,
  IStatementHeader,
} from '@common/services/aiAssistant/documents/types'
import { periodKey } from '@utils/debt-calculation/months'
import {
  checkStatement,
  CorrectionSign,
  IStatementIssue,
  IStatementRow,
  mergeStatementRows,
} from '@utils/debt-calculation/statement'

/** What reading one photo produced. */
export interface IReadPhoto {
  jobId: string
  name: string
  header: IStatementHeader
  candidates: ICompanyCandidate[]
  suggestedCompanyId: string | null
  /** Rows per strip, as parsed. */
  strips: IStatementRow[][]
  /** Problems met while reading (unreadable rows, unknown columns). */
  issues: IStatementIssue[]
}

/** One flat's statement, possibly spread over several photos. */
export interface IStatementGroup {
  key: string
  photoNames: string[]
  header: IStatementHeader
  candidates: ICompanyCandidate[]
  suggestedCompanyId: string | null
  rows: IStatementRow[]
  issues: IStatementIssue[]
  correctionSign: CorrectionSign
}

/**
 * The numbers of an address - «вул. Покровська буд. 149 кв. 72» → `149/72`.
 * Photos of one flat's pages share it even when the photo cut the street
 * name; two flats of one building differ in it.
 */
export const addressKey = (header: IStatementHeader): string | null => {
  const numbers: string[] = [...((header.address ?? '').match(/\d+/g) ?? [])]
  const apartment = /\d+/.exec(header.apartment ?? '')?.[0]
  if (apartment && numbers[numbers.length - 1] !== apartment) {
    numbers.push(apartment)
  }

  return numbers.length > 0
    ? numbers.map((n) => String(Number(n))).join('/')
    : null
}

const TOLERANCE = 0.005

/** Page two of a statement opens where page one closed, the month after. */
const continues = (
  earlier: IStatementRow[],
  later: IStatementRow[]
): boolean => {
  const last = earlier[earlier.length - 1]
  const first = later[0]

  return (
    !!last &&
    !!first &&
    periodKey(first) - periodKey(last) === 1 &&
    last.closing !== null &&
    first.opening !== null &&
    Math.abs(last.closing - first.opening) <= TOLERANCE
  )
}

const sortedRows = (photo: IReadPhoto): IStatementRow[] =>
  mergeStatementRows(photo.strips)

/**
 * Two readings of the same flat agree on the months they share. A header
 * misread as another flat (кв. 71 read as 72) would otherwise pour one flat's
 * months into another's statement; their balances give it away.
 */
const agrees = (a: IStatementRow[], b: IStatementRow[]): boolean => {
  const byKey = new Map(a.map((row) => [periodKey(row), row]))
  const shared = b.filter((row) => byKey.has(periodKey(row)))
  if (shared.length === 0) return true

  const matching = shared.filter((row) => {
    const other = byKey.get(periodKey(row))
    return (
      other.opening !== null &&
      row.opening !== null &&
      Math.abs(other.opening - row.opening) <= TOLERANCE
    )
  })
  return matching.length * 2 >= shared.length
}

/**
 * Groups photos by flat and joins each flat's pages into one statement.
 *
 * Photos go together when their addresses carry the same numbers, or - when
 * a header was cut off - when one photo's table picks up exactly where the
 * other's ends; and never when the months they share disagree.
 */
export const groupStatements = (photos: IReadPhoto[]): IStatementGroup[] => {
  const groups: IReadPhoto[][] = []

  for (const photo of photos) {
    const key = addressKey(photo.header)
    const rows = sortedRows(photo)
    const home = groups.find(
      (group) =>
        group.some((other) => {
          const otherKey = addressKey(other.header)
          if (key && otherKey) return key === otherKey
          const otherRows = sortedRows(other)
          return continues(otherRows, rows) || continues(rows, otherRows)
        }) && group.every((other) => agrees(sortedRows(other), rows))
    )

    if (home) home.push(photo)
    else groups.push([photo])
  }

  return groups.map((group) => {
    const rows = mergeStatementRows(group.flatMap(({ strips }) => strips))
    const checked = checkStatement(rows)
    const withHeader = group.find(({ header }) => header.address) ?? group[0]
    const withCandidates =
      group.find(({ suggestedCompanyId }) => suggestedCompanyId) ??
      group.find(({ candidates }) => candidates.length > 0) ??
      group[0]

    return {
      key: group.map(({ jobId }) => jobId).join('+'),
      photoNames: group.map(({ name }) => name),
      header: withHeader.header,
      candidates: withCandidates.candidates,
      suggestedCompanyId: withCandidates.suggestedCompanyId,
      rows: checked.rows,
      issues: [...group.flatMap(({ issues }) => issues), ...checked.issues],
      correctionSign: checked.correctionSign,
    }
  })
}

const monthLabel = ({ year, month }: { year: number; month: number }) =>
  `${String(month).padStart(2, '0')}.${year}`

/**
 * What the chat model learns about the photos - it never sees them. Kept
 * short: it rides along in every later request of the conversation.
 */
export const describeBatch = (
  groups: IStatementGroup[],
  unrecognized: number
): string => {
  const parts = groups.map((group) => {
    const first = group.rows[0]
    const last = group.rows[group.rows.length - 1]
    const who = group.header.address ?? 'без адреси'
    return first
      ? `${who}: ${group.rows.length} міс. (${monthLabel(first)}–${monthLabel(last)}), вихідне сальдо ${last.closing ?? '—'} грн, зауважень ${group.issues.length}`
      : `${who}: рядків не прочитано`
  })
  if (unrecognized > 0) parts.push(`не розпізнано фото: ${unrecognized}`)

  return (
    `[Користувач надіслав фото таблиць боргу по місяцях. ${parts.join('; ')}. ` +
    'Показано картки: користувач обирає компанію й заповнює розрахунок заборгованості кнопкою в картці, а платежі створює вже на сторінці розрахунку.]'
  )
}
