import { formatPeriod, IYearMonth, periodKey } from './months'

/**
 * A printed monthly debt statement ("Інформація по місяцях") read off photos.
 *
 * One row per month. The column set varies between billing programs, so rows
 * arrive as raw cells plus the printed column titles, and every column is
 * mapped to a role by its title. Several payment columns ("Ел. банк",
 * "Оплата", "Субсидія") are summed into one `paid`. `null` means the cell was
 * blank - on these printouts a blank reads as zero.
 */
export interface IStatementRow extends IYearMonth {
  opening: number | null
  /** As printed. Which way it moves the debt is decided per statement. */
  correction: number | null
  charged: number | null
  paid: number | null
  closing: number | null
}

export type StatementIssueKind =
  'unreadable' | 'arithmetic' | 'gap' | 'autocorrected' | 'columns'

export interface IStatementIssue {
  kind: StatementIssueKind
  /** `YYYY-MM` of the row the issue points at, when it is about one row. */
  period?: string
  message: string
}

/**
 * How a printed correction moves the debt: `-1` lowers it (a recalculation
 * in the tenant's favour - what the HOA printouts seen so far do), `1` raises
 * it.
 */
export type CorrectionSign = 1 | -1

export const DEFAULT_CORRECTION_SIGN: CorrectionSign = -1

/** Kopecks: a statement is exact to the kopeck, anything looser hides a misread digit. */
const TOLERANCE = 0.005

const round2 = (value: number): number => Math.round(value * 100) / 100

const same = (a: number | null, b: number | null): boolean =>
  a !== null && b !== null && Math.abs(a - b) <= TOLERANCE

const UNREADABLE = Symbol('unreadable')

/**
 * Parses an amount the way the printout shows it: `4 217,35`, `-150,00`,
 * `(150,00)`, a typographic minus. Blank is `null`; anything that is not a
 * number is {@link UNREADABLE} so the row gets flagged instead of silently
 * becoming zero.
 */
export const parseAmount = (
  raw: string | null | undefined
): number | null | typeof UNREADABLE => {
  if (raw === null || raw === undefined) return null

  let text = String(raw)
    .replace(/[\s  ]/g, '')
    .replace(/[−–—]/g, '-')
  if (text === '' || text === '-') return null

  let negative = false
  if (/^\(.*\)$/.test(text)) {
    negative = true
    text = text.slice(1, -1)
  }

  // Both separators present: the last one is the decimal point.
  const lastComma = text.lastIndexOf(',')
  const lastDot = text.lastIndexOf('.')
  if (lastComma !== -1 && lastDot !== -1) {
    const decimal = lastComma > lastDot ? ',' : '.'
    const thousands = decimal === ',' ? '.' : ','
    text = text.split(thousands).join('')
  }
  text = text.replace(',', '.')

  if (!/^-?\d+(\.\d+)?$/.test(text)) return UNREADABLE

  const value = Number(text)

  return round2(negative ? -value : value)
}

const MONTH_NAMES = [
  'січ',
  'лют',
  'бер',
  'квіт',
  'трав',
  'черв',
  'лип',
  'серп',
  'вер',
  'жовт',
  'лист',
  'груд',
]

const fullYear = (year: number): number => (year < 100 ? 2000 + year : year)

/**
 * Reads the month cell in any of the shapes billing programs print:
 * `8/2018`, `08.2018`, `8/18`, `2018-08`, `Серпень 2018`.
 */
export const parsePeriodCell = (raw: string): IYearMonth | null => {
  const text = String(raw ?? '')
    .trim()
    .toLowerCase()

  let year: number
  let month: number

  const numeric = /^(\d{1,2})\s*[/.\-]\s*(\d{2}|\d{4})$/.exec(text)
  const iso = /^(\d{4})\s*[-/.]\s*(\d{1,2})$/.exec(text)
  const named = /^([а-яіїєґ']+)\.?\s+(\d{4})$/.exec(text)

  if (iso) {
    year = Number(iso[1])
    month = Number(iso[2])
  } else if (numeric) {
    month = Number(numeric[1])
    year = fullYear(Number(numeric[2]))
  } else if (named) {
    month = MONTH_NAMES.findIndex((stem) => named[1].startsWith(stem)) + 1
    year = Number(named[2])
  } else {
    return null
  }

  if (month < 1 || month > 12 || year < 1990 || year > 2100) return null

  return { year, month }
}

export type ColumnRole =
  | 'period'
  | 'opening'
  | 'correction'
  | 'charged'
  | 'payment'
  | 'closing'
  | 'ignored'

const ROLE_BY_TITLE: [RegExp, ColumnRole][] = [
  [/вхідн/, 'opening'],
  [/вихідн/, 'closing'],
  [/корект|перерах/, 'correction'],
  [/нарах/, 'charged'],
  [/оплат|банк|субсид|сплач|пільг|надход|надійш/, 'payment'],
  [/міс|рік|рк|період|дата/, 'period'],
]

/**
 * Roles of the columns, left to right, by their printed titles.
 *
 * Titles come off a photo and are often garbled ("Мі/Рк" for "М/Рік",
 * "Нараху-вання"), so only word stems are matched. The month column is also
 * taken as the first column nothing else claimed - it is always the leftmost.
 */
export const columnRoles = (titles: string[]): ColumnRole[] => {
  const roles = titles.map((title) => {
    const text = String(title ?? '')
      .toLowerCase()
      .replace(/[^а-яіїєґa-z/]/g, '')
    return ROLE_BY_TITLE.find(([pattern]) => pattern.test(text))?.[1] ?? null
  })

  if (!roles.includes('period')) {
    const first = roles.findIndex((role) => role === null)
    if (first === 0) roles[0] = 'period'
  }

  return roles.map((role) => role ?? 'ignored')
}

const ESSENTIAL_ROLES: ColumnRole[] = [
  'period',
  'opening',
  'charged',
  'closing',
]

export interface IParsedCells {
  rows: IStatementRow[]
  issues: IStatementIssue[]
}

type RowAmounts = Omit<IStatementRow, 'year' | 'month'>

const sumOf = (values: number[]): number | null =>
  values.length > 0
    ? round2(values.reduce((acc, value) => acc + value, 0))
    : null

/** Cells mapped to roles by position - exact when the cell count matches. */
const byPosition = (
  roles: ColumnRole[],
  cells: string[]
): RowAmounts | null => {
  if (cells.length !== roles.length) return null

  const values = cells.map((cell, index) =>
    roles[index] === 'period' || roles[index] === 'ignored'
      ? null
      : parseAmount(cell)
  )
  if (values.some((value) => value === UNREADABLE)) return null

  const pick = (role: ColumnRole) =>
    sumOf(
      values.filter(
        (value, index): value is number =>
          roles[index] === role && typeof value === 'number'
      )
    )

  return {
    opening: pick('opening'),
    correction: pick('correction'),
    charged: pick('charged'),
    paid: pick('payment'),
    closing: pick('closing'),
  }
}

/**
 * Cells mapped to roles by what they hold, for rows whose cell count is off.
 *
 * The model often slips an extra empty cell in among the payment columns (or
 * drops one) - every figure right, the row still misaligned. Blank cells are
 * dropped; the leading figures fill the columns before the payments, the
 * trailing ones the columns after, and whatever is in between is payment,
 * which is summed anyway. Only for the usual layout: no unknown columns, and
 * the payments in one block.
 */
const byContent = (roles: ColumnRole[], cells: string[]): RowAmounts | null => {
  if (roles[0] !== 'period') return null
  const data = roles.slice(1)
  const firstPayment = data.indexOf('payment')
  const lastPayment = data.lastIndexOf('payment')
  if (data.includes('ignored') || firstPayment === -1) return null

  const lead = data.slice(0, firstPayment)
  const trail = data.slice(lastPayment + 1)
  if (data.slice(firstPayment, lastPayment + 1).some((r) => r !== 'payment')) {
    return null
  }

  const values = cells.slice(1).map(parseAmount)
  if (values.some((value) => value === UNREADABLE)) return null
  const figures = values.filter((value): value is number => value !== null)
  if (figures.length < lead.length + trail.length) return null

  const assigned: Partial<Record<ColumnRole, number[]>> = {}
  const put = (role: ColumnRole, value: number) =>
    (assigned[role] = [...(assigned[role] ?? []), value])

  lead.forEach((role, index) => put(role, figures[index]))
  trail.forEach((role, index) =>
    put(role, figures[figures.length - trail.length + index])
  )
  figures
    .slice(lead.length, figures.length - trail.length)
    .forEach((value) => put('payment', value))

  const pick = (role: ColumnRole) => sumOf(assigned[role] ?? [])

  return {
    opening: pick('opening'),
    correction: pick('correction'),
    charged: pick('charged'),
    paid: pick('payment'),
    closing: pick('closing'),
  }
}

/**
 * A line in some other separator - spaces, `;`, tabs - split into cells, when
 * it starts with a month («8/2018 622,86 0,00 …», «Серпень 2018 622,86 …»).
 * Figures carry no inner spaces here: the prompt asks for them written
 * without, so a space can only be a separator.
 */
const splitLoose = (line: string): string[] | null => {
  const tokens = line.split(/[;\t]|\s+/).filter(Boolean)
  if (tokens.length < 3) return null
  if (parsePeriodCell(tokens[0])) return tokens
  if (parsePeriodCell(`${tokens[0]} ${tokens[1]}`)) {
    return [`${tokens[0]} ${tokens[1]}`, ...tokens.slice(2)]
  }
  return null
}

/**
 * Brings the model's rows to one shape: one row per line, cells joined by `|`.
 *
 * The model does not always answer in the asked-for format. Seen on real
 * strips, or one step away from it:
 * - cell by cell: `8/2018`, `622,86`, `0,00`, … one element each, blanks left
 *   out - a lone month cell starts a row, the lone figures after it are its;
 * - several rows in one element, one per line;
 * - another separator: spaces, `;` or tabs.
 * Rows rebuilt this way usually miss their blank cells, so they are read by
 * content, like any row whose cell count is off.
 */
export const regroupCells = (lines: string[]): string[] => {
  const out: string[] = []
  let row: string[] | null = null
  const flush = () => {
    if (row) out.push(row.join('|'))
    row = null
  }

  const pieces = lines.flatMap((raw) => String(raw ?? '').split(/\r?\n/))
  for (const raw of pieces) {
    const line = raw.trim()
    if (!line) continue

    const loose = line.includes('|') ? null : splitLoose(line)
    if (line.includes('|') || loose) {
      flush()
      out.push(loose ? loose.join('|') : line)
    } else if (parsePeriodCell(line)) {
      flush()
      row = [line]
    } else if (row) {
      row.push(line)
    } else {
      out.push(line)
    }
  }
  flush()

  return out
}

const balancesEitherWay = (amounts: RowAmounts): boolean => {
  const row = { year: 0, month: 0, ...amounts }
  return balances(row, -1) || balances(row, 1)
}

/**
 * Turns the model's raw rows (`cell|cell|…`) into typed rows.
 *
 * A row is read by position when its cell count matches the header, and by
 * content (see {@link byContent}) otherwise; when both are possible, the one
 * that adds up wins. Only a row neither way can read - a figure that is not a
 * number, a missing month - is dropped and reported: a guess would be worse
 * than a gap.
 */
export const parseStatementCells = (
  titles: string[],
  lines: string[]
): IParsedCells => {
  const roles = columnRoles(titles)
  const issues: IStatementIssue[] = []

  const missing = ESSENTIAL_ROLES.filter((role) => !roles.includes(role))
  if (missing.length > 0) {
    return {
      rows: [],
      issues: [
        {
          kind: 'columns',
          message: `Не впізнав колонки таблиці (${titles.join(', ')}). Потрібні хоча б місяць, вхідне сальдо, нарахування і вихідне сальдо.`,
        },
      ],
    }
  }

  const rows: IStatementRow[] = []

  regroupCells(lines).forEach((line) => {
    // The column header read as a row - no figures at all, nothing lost.
    if (!/\d/.test(line)) return
    // The totals row under the table - sums, not a month.
    if (/^\s*(всього|разом|итого|підсумок)/i.test(line)) return

    const cells = String(line ?? '').split('|')
    const period = parsePeriodCell(
      cells[roles[0] === 'period' ? 0 : roles.indexOf('period')] ?? ''
    )
    const readings = [byPosition(roles, cells), byContent(roles, cells)].filter(
      (reading): reading is RowAmounts => reading !== null
    )
    const amounts = readings.find(balancesEitherWay) ?? readings[0]

    if (!period || !amounts) {
      issues.push({
        kind: 'unreadable',
        ...(period ? { period: formatPeriod(period) } : {}),
        message: `Рядок «${line}» не вдалося прочитати — його пропущено.`,
      })
      return
    }

    rows.push({ ...period, ...amounts })
  })

  return { rows, issues }
}

/** How far a row is from balancing with the given correction sign. */
const residual = (row: IStatementRow, sign: CorrectionSign): number | null => {
  if (row.opening === null || row.closing === null) return null

  return round2(
    row.opening +
      sign * (row.correction ?? 0) +
      (row.charged ?? 0) -
      (row.paid ?? 0) -
      row.closing
  )
}

const balances = (row: IStatementRow, sign: CorrectionSign): boolean => {
  const value = residual(row, sign)
  return value !== null && Math.abs(value) <= TOLERANCE
}

/**
 * Which way corrections go on this statement, decided by the statement itself:
 * every row with a non-zero correction votes for the sign that makes it
 * balance. With no such row, or a tie, the default applies.
 */
export const detectCorrectionSign = (rows: IStatementRow[]): CorrectionSign => {
  let votes = 0

  for (const row of rows) {
    if (!row.correction) continue
    const minus = balances(row, -1)
    const plus = balances(row, 1)
    if (minus && !plus) votes -= 1
    if (plus && !minus) votes += 1
  }

  if (votes > 0) return 1
  if (votes < 0) return -1
  return DEFAULT_CORRECTION_SIGN
}

/**
 * Joins rows read from overlapping photo strips and from several pages.
 *
 * A month read more than once keeps the copy that fits best: one that adds up
 * beats one that does not, and among those the one that chains with the
 * neighbouring months - its opening equals some reading of the month before
 * and its closing some reading of the month after. Two copies can each add up
 * on their own (a missed payment plus a misread closing), and only the chain
 * tells which is the sheet.
 */
export const mergeStatementRows = (
  lists: IStatementRow[][]
): IStatementRow[] => {
  const all = lists.flat()
  const sign = detectCorrectionSign(all)
  const byPeriod = new Map<number, IStatementRow[]>()

  for (const row of all) {
    const key = periodKey(row)
    byPeriod.set(key, [...(byPeriod.get(key) ?? []), row])
  }

  const fits = (row: IStatementRow): number => {
    const key = periodKey(row)
    const before = byPeriod.get(key - 1) ?? []
    const after = byPeriod.get(key + 1) ?? []
    return (
      (balances(row, sign) ? 2 : 0) +
      (before.some(({ closing }) => same(closing, row.opening)) ? 1 : 0) +
      (after.some(({ opening }) => same(opening, row.closing)) ? 1 : 0)
    )
  }

  return [...byPeriod.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, copies]) =>
      copies.reduce((best, row) => (fits(row) > fits(best) ? row : best))
    )
}

export interface ICheckedStatement {
  rows: IStatementRow[]
  issues: IStatementIssue[]
  correctionSign: CorrectionSign
}

const money = (value: number | null): string => (value ?? 0).toFixed(2)

/** Where a row should land: `opening ± correction + charged - paid`. */
const expectedClosing = (
  row: IStatementRow,
  sign: CorrectionSign
): number | null =>
  row.opening === null
    ? null
    : round2(
        row.opening +
          sign * (row.correction ?? 0) +
          (row.charged ?? 0) -
          (row.paid ?? 0)
      )

const isNextMonth = (row: IStatementRow, other?: IStatementRow): boolean =>
  !!other && periodKey(other) - periodKey(row) === 1

/**
 * Re-aligns rows whose right-hand block - payments and closing - was read one
 * row off.
 *
 * On a photo taken at an angle the right half of the table sits a little
 * higher or lower than the left, and a whole stretch of rows can come back
 * with the payments and closing of the neighbouring month (seen on real
 * printouts and on tilted test sheets alike). The left block - month,
 * opening, correction, charge - stays put. A row that does not add up but
 * does with its neighbour's right block, and whose closing then equals the
 * next month's opening, takes that block. Rows are tested against the
 * original readings, so one shift never feeds the next.
 */
const realignRightBlock = (
  rows: IStatementRow[],
  sign: CorrectionSign,
  issues: IStatementIssue[]
): IStatementRow[] => {
  /** Receiver index → donor index, for every block that moved. */
  const moves = new Map<number, number>()

  const realigned = rows.map((row, index) => {
    const next = isNextMonth(row, rows[index + 1]) ? rows[index + 1] : undefined
    const expected = expectedClosing(row, sign)
    if (
      expected === null ||
      same(expected, row.closing) ||
      same(expected, next?.opening ?? null)
    ) {
      return row
    }

    for (const donorIndex of [index - 1, index + 1]) {
      const donor = rows[donorIndex]
      if (!donor || Math.abs(periodKey(donor) - periodKey(row)) !== 1) continue
      const shifted = { ...row, paid: donor.paid, closing: donor.closing }
      if (
        same(expectedClosing(shifted, sign), shifted.closing) &&
        (!next || same(shifted.closing, next.opening))
      ) {
        moves.set(index, donorIndex)
        issues.push({
          kind: 'autocorrected',
          period: formatPeriod(row),
          message: `${formatPeriod(row)}: оплата й вихідне сальдо зʼїхали на рядок — вирівняно (оплата ${money(shifted.paid)}).`,
        })
        return shifted
      }
    }
    return row
  })

  // A donor that kept the block it gave away holds another month's payment -
  // one that may even add up with its own opening (a zero-charge month does).
  // Its own payment is what its opening and the receiver's opening leave.
  moves.forEach((donorIndex, receiverIndex) => {
    if (moves.has(donorIndex)) return
    const donor = realigned[donorIndex]
    const receiver = realigned[receiverIndex]
    const after =
      donorIndex < receiverIndex
        ? receiver
        : isNextMonth(donor, realigned[donorIndex + 1])
          ? realigned[donorIndex + 1]
          : undefined
    const bare = expectedClosing({ ...donor, paid: 0 }, sign)
    if (!after || after.opening === null || bare === null) return

    const paid = round2(bare - after.opening)
    if (paid < 0 || same(paid, donor.paid ?? 0)) return

    issues.push({
      kind: 'autocorrected',
      period: formatPeriod(donor),
      message: `${formatPeriod(donor)}: оплату ${money(donor.paid)} прочитано з сусіднього рядка — за сальдо тут ${money(paid)}.`,
    })
    realigned[donorIndex] = { ...donor, paid, closing: after.opening }
  })

  return realigned
}

/**
 * Cross-checks the statement and repairs what it safely can.
 *
 * The printout is self-checking, which is what makes a photo import safe:
 * `opening ± correction + charged - paid` must land on the month's closing
 * balance AND on the next month's opening. Either witness is enough - on a
 * skewed photo the closing column of a whole stretch was read one row off,
 * while the opening column, next to the month, stayed put. The import never
 * uses closings (only charges, payments and the first opening), so a drifted
 * closing is harmless once the openings confirm the row.
 *
 * Repairs, flagged so the user sees them:
 * - a right-hand block read one row off (see {@link realignRightBlock});
 * - a charge read off the neighbouring row at a tariff change: the charge the
 *   balances imply equals a neighbour's tariff;
 * - a payment the balances pin down: the charge fits a neighbour's, and
 *   either both witnesses agree, or the next month is sound on its own - then
 *   its opening, from the reliable left block, settles it. That is how the
 *   first row of a drifted stretch, whose own payment was read onto another
 *   row, gets its payment back.
 * The charge is tried before the payment - read the other way round, a
 * misread charge turned into an invented payment.
 */
export const checkStatement = (input: IStatementRow[]): ICheckedStatement => {
  const sign = detectCorrectionSign(input)
  const issues: IStatementIssue[] = []
  const rows = realignRightBlock(input, sign, issues)

  const sound = (row?: IStatementRow, after?: IStatementRow): boolean => {
    const expected = row ? expectedClosing(row, sign) : null
    return (
      expected !== null &&
      (same(expected, row.closing) || same(expected, after?.opening ?? null))
    )
  }

  const checked = rows.map((row, index) => {
    const period = formatPeriod(row)
    const prev =
      index > 0 && isNextMonth(rows[index - 1], row)
        ? rows[index - 1]
        : undefined
    const next = isNextMonth(row, rows[index + 1]) ? rows[index + 1] : undefined

    if (index > 0 && !prev) {
      issues.push({
        kind: 'gap',
        period,
        message: `Між ${formatPeriod(rows[index - 1])} і ${period} бракує місяців.`,
      })
    }

    const expected = expectedClosing(row, sign)
    const witnesses = [row.closing, next?.opening ?? null].filter(
      (value): value is number => value !== null
    )
    if (expected === null || witnesses.length === 0) return row
    if (witnesses.some((witness) => same(expected, witness))) return row

    const nextSound =
      !!next &&
      next.opening !== null &&
      sound(
        next,
        isNextMonth(next, rows[index + 2]) ? rows[index + 2] : undefined
      )
    const witnessesAgree = witnesses.every((witness) =>
      same(witness, witnesses[0])
    )
    const target = nextSound ? next.opening : witnesses[0]
    const openingConfirmed =
      !prev ||
      same(prev.closing, row.opening) ||
      same(expectedClosing(prev, sign), row.opening)
    const trusted = (witnessesAgree || nextSound) && openingConfirmed

    const neighbourCharges = [
      rows[index - 1]?.charged ?? null,
      rows[index + 1]?.charged ?? null,
    ]
    const derivedCharged = round2((row.charged ?? 0) + target - expected)
    const derivedPaid = round2((row.paid ?? 0) + expected - target)

    if (
      trusted &&
      neighbourCharges.some((charge) => same(charge, derivedCharged))
    ) {
      issues.push({
        kind: 'autocorrected',
        period,
        message: `${period}: нарахування взято з сальдо — ${money(derivedCharged)} замість прочитаних ${money(row.charged)}.`,
      })
      return { ...row, charged: derivedCharged, closing: target }
    }

    const chargeFits = neighbourCharges.some((charge) =>
      same(charge, row.charged)
    )
    if (trusted && chargeFits && derivedPaid >= 0) {
      issues.push({
        kind: 'autocorrected',
        period,
        message: `${period}: оплату взято з сальдо — ${money(derivedPaid)} замість прочитаних ${money(row.paid)}.`,
      })
      return { ...row, paid: derivedPaid, closing: target }
    }

    issues.push({
      kind: 'arithmetic',
      period,
      message: `${period}: рядок не сходиться на ${money(Math.abs(expected - target))} грн (вхідне ${money(row.opening)}, нарахування ${money(row.charged)}, оплата ${money(row.paid)}, вихідне ${money(row.closing)}). Перевірте цифри.`,
    })
    return row
  })

  return {
    rows: carryPaperJumps(checked, sign, issues),
    issues,
    correctionSign: sign,
  }
}

/**
 * A jump in the balance printed on the paper itself: a month opens with a
 * different figure than the previous one closed, while each of the two rows
 * adds up on its own - a recalculation the billing program made outside the
 * correction column (seen on real printouts in 11/2022). Left as it is, the
 * calculation, which carries the balance month to month, would drift from
 * the paper by that amount. So the jump becomes part of that month's
 * correction, and the row opens where the previous one closed.
 */
const carryPaperJumps = (
  rows: IStatementRow[],
  sign: CorrectionSign,
  issues: IStatementIssue[]
): IStatementRow[] =>
  rows.map((row, index) => {
    const prev = rows[index - 1]
    if (
      !prev ||
      !isNextMonth(prev, row) ||
      prev.closing === null ||
      row.opening === null ||
      same(prev.closing, row.opening) ||
      !same(expectedClosing(prev, sign), prev.closing) ||
      !same(expectedClosing(row, sign), row.closing)
    ) {
      return row
    }

    const jump = round2(row.opening - prev.closing)
    issues.push({
      kind: 'autocorrected',
      period: formatPeriod(row),
      message: `${formatPeriod(row)}: на папері вхідне сальдо ${money(row.opening)} не дорівнює вихідному попереднього місяця ${money(prev.closing)} — різницю ${money(jump)} враховано як коректуру.`,
    })
    return {
      ...row,
      opening: prev.closing,
      correction: round2((row.correction ?? 0) + jump / sign),
    }
  })

/** One month as it becomes payments. */
export interface IStatementMonth extends IYearMonth {
  /** The charge as printed. */
  charged: number
  /** The correction as a change to the debt: negative lowers it. */
  correction: number
  paid: number
}

export interface IStatementImport {
  /** Debt at the start of the first month - becomes the «Вхідне сальдо» invoice. */
  openingBalance: (IYearMonth & { amount: number }) | null
  months: IStatementMonth[]
}

/** What the import writes, derived from checked rows. */
export const toStatementImport = (
  rows: IStatementRow[],
  sign: CorrectionSign
): IStatementImport => {
  const sorted = [...rows].sort((a, b) => periodKey(a) - periodKey(b))
  const first = sorted[0]

  return {
    openingBalance:
      first && first.opening !== null
        ? { year: first.year, month: first.month, amount: first.opening }
        : null,
    months: sorted.map(({ year, month, charged, correction, paid }) => ({
      year,
      month,
      charged: charged ?? 0,
      // `|| 0`: a zero times the -1 sign is -0.
      correction: round2(sign * (correction ?? 0)) || 0,
      paid: paid ?? 0,
    })),
  }
}
