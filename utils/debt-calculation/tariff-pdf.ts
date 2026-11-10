import type {
  IBuildingTariffs,
  ITariffGroup,
  ITariffPeriod,
} from './building-tariffs'
import { apartmentRanges, tariffWarnings } from './building-tariffs'
import { dayNumber } from './exclusions'

/**
 * Reads a building's tariff table out of a PDF's text - no model: the
 * document has its text with positions, and the template is the same from
 * building to building.
 *
 *   № | Період дії тарифів        | Номери квартир          | Тарифи …
 *   1 | З 10.06 2018 по 30.09.2019 | №№ 1-4; 37-40; 73-76;   |
 *     | І поверх                   | 109-112                 | 4,46
 *     | вище І поверху             | решта квартир           | 5,50
 *
 * Each row starts at «З <date>». Within a row, the lines under the date in
 * the period column («І поверх», «вище І поверху») are its groups; every
 * apartment line and tariff goes to the group whose line is nearest
 * vertically - the tariffs do not always sit on their group's line.
 */

/** One run of text on a page; `y` grows upwards, as PDF has it. */
export interface ITextRun {
  str: string
  x: number
  y: number
  width: number
}

export interface ITariffPdfRead {
  /** False for a scan: a picture of a page, no text to read. */
  hasText: boolean
  tariffs: IBuildingTariffs | null
  /** Things to check before saving, in the user's words. */
  warnings: string[]
}

/** Runs within this much of each other vertically are on one line. */
const LINE_TOLERANCE = 3
/** A run belongs to the column whose title starts at most this far right. */
const COLUMN_TOLERANCE = 6

const DATE = String.raw`(\d{1,2})\s*\.\s*(\d{1,2})\s*\.?\s*(\d{4})`
const PERIOD = new RegExp(
  String.raw`з\s*${DATE}\s*(?:р\.?\s*)?(?:по|до|[-–—])\s*(?:${DATE}|(даний|теперішній|цей)\s+час)`,
  'i'
)
const ROW_START = /^з\s*\d/i
const NUMBER = /\d+(?:[.,]\d+)?/g

type Role = 'number' | 'period' | 'apartments' | 'tariff'

const ROLES: [Role, RegExp][] = [
  ['period', /період/i],
  ['apartments', /квартир/i],
  ['tariff', /тариф/i],
  ['number', /^№$/],
]

interface IColumn {
  role: Role
  left: number
}

interface ILine {
  y: number
  text: string
}

const iso = (day: string, month: string, year: string): string | null => {
  const value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  return dayNumber(value) === null ? null : value
}

const label = (value: string): string => {
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

/** Runs of one column within a row, as lines from top to bottom. */
const toLines = (runs: ITextRun[]): ILine[] => {
  const lines: { y: number; runs: ITextRun[] }[] = []
  for (const run of [...runs].sort((a, b) => b.y - a.y)) {
    const line = lines.find(({ y }) => Math.abs(y - run.y) <= LINE_TOLERANCE)
    if (line) line.runs.push(run)
    else lines.push({ y: run.y, runs: [run] })
  }
  return lines.map(({ y, runs: parts }) => ({
    y,
    text: parts
      .sort((a, b) => a.x - b.x)
      .map(({ str }) => str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }))
}

/** Lines joined back: a range broken after its hyphen («109-» / «114») is one. */
const joinLines = (lines: ILine[]): string =>
  lines
    .map(({ text }) => text)
    .reduce(
      (all, part) =>
        !all ? part : /[-–—]$/.test(all) ? `${all}${part}` : `${all} ${part}`,
      ''
    )

/** «№№ 1-4; 37-40;» → «1-4; 37-40»; «решта квартир» → «» (the rest). */
const apartmentsText = (raw: string): string =>
  apartmentRanges(raw).length === 0
    ? ''
    : raw
        .replace(/№/g, '')
        .replace(/\s*;\s*/g, '; ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/[;,\s]+$/, '')
        .replace(/\s+/g, ' ')
        .trim()

const nearest = (anchors: number[], y: number): number =>
  anchors.reduce(
    (best, anchor, index) =>
      Math.abs(anchor - y) < Math.abs(anchors[best] - y) ? index : best,
    0
  )

/** The most frequent value; the first one among equals. */
const mostCommon = (values: string[]): string => {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].reduce(
    (best, entry) => (entry[1] > best[1] ? entry : best),
    ['', 0] as [string, number]
  )[0]
}

interface IRow {
  number: number
  from: string
  to?: string
  groups: { label: string; apartments: string; tariff: number | null }[]
}

/**
 * The column titles: the first line that names both the period and the
 * tariffs. The document's own title says «період» and «тарифи» too, but on
 * lines of their own.
 */
const columnsOf = (runs: ITextRun[]): IColumn[] => {
  const lines: ITextRun[][] = []
  for (const run of [...runs].sort((a, b) => b.y - a.y)) {
    const line = lines.find(
      ([first]) => Math.abs(first.y - run.y) <= LINE_TOLERANCE
    )
    if (line) line.push(run)
    else lines.push([run])
  }

  for (const line of lines) {
    // One role per title, the first that fits: «Період дії тарифів» is the
    // period, though it says «тарифів».
    const columns: IColumn[] = []
    for (const run of line) {
      const role = ROLES.find(
        ([taken, pattern]) =>
          !columns.some((column) => column.role === taken) &&
          pattern.test(run.str.trim())
      )?.[0]
      if (role) columns.push({ role, left: run.x })
    }
    if (
      columns.some(({ role }) => role === 'period') &&
      columns.some(({ role }) => role === 'tariff')
    ) {
      return columns.sort((a, b) => a.left - b.left)
    }
  }
  return []
}

const roleOf = (columns: IColumn[], run: ITextRun): Role | undefined =>
  [...columns].reverse().find(({ left }) => left <= run.x + COLUMN_TOLERANCE)
    ?.role

const readRow = (runs: ITextRun[], columns: IColumn[]): IRow | null => {
  const byRole = (role: Role) =>
    toLines(runs.filter((run) => roleOf(columns, run) === role))

  const periodLines = byRole('period')
  const dateAt = periodLines.findIndex(({ text }) => PERIOD.test(text))
  if (dateAt < 0) return null
  const match = PERIOD.exec(periodLines[dateAt].text)
  const from = iso(match[1], match[2], match[3])
  if (!from) return null
  const to = match[4] ? iso(match[4], match[5], match[6]) : null

  // Groups: the lines under the date; without them, each tariff is one.
  const named = periodLines.filter((_, index) => index !== dateAt)
  const tariffs = byRole('tariff').flatMap(({ y, text }) =>
    (text.match(NUMBER) ?? []).map((value) => ({
      y,
      value: Number(value.replace(',', '.')),
    }))
  )
  const anchors =
    named.length > 0 ? named.map(({ y }) => y) : tariffs.map(({ y }) => y)
  if (anchors.length === 0) return null

  const apartments = anchors.map(() => [] as ILine[])
  for (const line of byRole('apartments')) {
    apartments[nearest(anchors, line.y)].push(line)
  }
  const values = anchors.map(() => null as number | null)
  for (const { y, value } of tariffs) {
    const at = nearest(anchors, y)
    if (values[at] === null) values[at] = value
  }

  const number = Number(
    byRole('number')
      .map(({ text }) => text)
      .join(' ')
      .match(/\d+/)?.[0]
  )

  return {
    number: Number.isFinite(number) ? number : 0,
    from,
    ...(to ? { to } : {}),
    groups: anchors.map((_, at) => ({
      label: named[at]?.text ?? '',
      apartments: apartmentsText(joinLines(apartments[at])),
      tariff: values[at],
    })),
  }
}

/** The address from the title: «… за адресою вул. Покровська, 149 за період …». */
const addressOf = (lines: string[]): string | undefined => {
  const title = lines.join(' ').replace(/\s+/g, ' ')
  return /адрес(?:ою|а|і)\s*:?\s*(.+?)(?:\s+за\s+період|\s*$)/i
    .exec(title)?.[1]
    ?.replace(/[,.\s]+$/, '')
    .trim()
}

export const readTariffTable = (pages: ITextRun[][]): ITariffPdfRead => {
  const all = pages.map((runs) => runs.filter(({ str }) => str.trim()))
  if (all.every((runs) => runs.length === 0)) {
    return {
      hasText: false,
      tariffs: null,
      warnings: [
        'У PDF немає тексту - схоже, це скан. Збережіть документ з Word як PDF або введіть тарифи вручну.',
      ],
    }
  }

  let columns: IColumn[] = []
  let address: string | undefined
  const rows: IRow[] = []

  for (const runs of all) {
    // A page that repeats no titles keeps the previous page's columns.
    const titles = columnsOf(runs)
    if (titles.length > 0) columns = titles
    const hasColumns = ['period', 'tariff'].every((role) =>
      columns.some((column) => column.role === role)
    )
    if (!hasColumns) continue

    const starts = runs
      .filter(
        (run) =>
          roleOf(columns, run) === 'period' && ROW_START.test(run.str.trim())
      )
      .sort((a, b) => b.y - a.y)
    if (starts.length === 0) continue

    const top = starts[0].y + LINE_TOLERANCE
    if (!address) {
      address = addressOf(
        toLines(runs.filter(({ y }) => y > top + 40)).map(({ text }) => text)
      )
    }

    // The last row ends where a row as tall as the tallest would: anything
    // further down (a signature, a note) is not the table.
    const heights = starts
      .slice(1)
      .map((start, index) => starts[index].y - start.y)
    const tallest = heights.length > 0 ? Math.max(...heights) : 120

    starts.forEach((start, index) => {
      const upper = start.y + LINE_TOLERANCE
      const lower = starts[index + 1]
        ? starts[index + 1].y + LINE_TOLERANCE
        : start.y - tallest
      const row = readRow(
        runs.filter(({ y }) => y <= upper && y > lower),
        columns
      )
      if (row) rows.push(row)
    })
  }

  if (rows.length === 0) {
    return {
      hasText: true,
      tariffs: null,
      warnings: [
        'Не знайшов таблицю тарифів: потрібні колонки «Період дії тарифів» і «Тарифи» та рядки «З <дата> по <дата>».',
      ],
    }
  }

  const warnings: string[] = []
  const count = Math.max(...rows.map(({ groups }) => groups.length))
  const groups: ITariffGroup[] = Array.from({ length: count }, (_, at) => ({
    label: mostCommon(
      rows.flatMap((row) => (row.groups[at] ? [row.groups[at].label] : []))
    ),
    apartments: mostCommon(
      rows.flatMap((row) => (row.groups[at] ? [row.groups[at].apartments] : []))
    ),
  }))

  rows.forEach((row) => {
    const name = row.number
      ? `Рядок ${row.number} (з ${label(row.from)})`
      : `Рядок з ${label(row.from)}`
    if (row.groups.length !== count) {
      warnings.push(
        `${name}: ${row.groups.length} тариф(и) замість ${count} - перевірте.`
      )
    }
    row.groups.forEach((group, at) => {
      const usual = groups[at]?.apartments
      if (usual !== undefined && group.apartments !== usual) {
        warnings.push(
          `${name}: квартири «${group.apartments || 'решта'}» замість «${usual || 'решта'}», як в інших рядках - узято «${usual || 'решта'}».`
        )
      }
    })
  })

  const periods: ITariffPeriod[] = rows
    .map((row) => ({
      from: row.from,
      ...(row.to ? { to: row.to } : {}),
      tariffs: groups.map((_, at) => row.groups[at]?.tariff ?? null),
    }))
    .sort((a, b) => a.from.localeCompare(b.from))

  const tariffs: IBuildingTariffs = {
    ...(address ? { address } : {}),
    groups,
    periods,
  }

  return {
    hasText: true,
    tariffs,
    warnings: [...warnings, ...tariffWarnings(tariffs)],
  }
}
