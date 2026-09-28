import type { IDocumentSurvey } from '@common/services/aiAssistant/documents/types'
import { IReadPhotoDeps, readStatementPhoto } from './readStatementPhoto'

const COLUMNS = [
  'М/Рік',
  'Вхідне сальдо',
  'Коректура',
  'Нарахування',
  'Ел. банк',
  'Оплата',
  'Субсидія',
  'Вихідне сальдо',
]

const survey = (rowCount: number): IDocumentSurvey => ({
  documentType: 'debtMonthlyStatement',
  header: {
    address: 'вул. Покровська буд. 149 кв. 72',
    apartment: '72',
    ownerName: null,
    accountNumber: null,
  },
  rowCount,
  candidates: [],
  suggestedCompanyId: null,
})

/** A clean statement of `count` months from 1/2024, 100 charged a month. */
const sheet = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => {
    const opening = 1000 + index * 100
    const period = `${(index % 12) + 1}/${2024 + Math.floor(index / 12)}`
    return `${period}|${opening},00|0,00|100,00||||${opening + 100},00`
  })

/**
 * Deps whose strips are answered by a script. `crop` encodes the strip in the
 * "image", so `readStrip` knows which one it is asked about.
 */
const deps = (
  answer: (
    strip: { top: number; bottom: number },
    columns?: string[]
  ) => Awaited<ReturnType<IReadPhotoDeps['readStrip']>>,
  over: Partial<IReadPhotoDeps> = {}
) => {
  const progress: any[] = []
  const waits: number[] = []
  const d: IReadPhotoDeps = {
    survey: jest.fn(async () => ({ ok: true, data: survey(28) })),
    crop: jest.fn(async (_url, strip) => JSON.stringify(strip)),
    readStrip: jest.fn(async (image, columns) =>
      answer(JSON.parse(image), columns)
    ),
    wait: jest.fn(async (seconds) => {
      waits.push(seconds)
    }),
    onProgress: (patch) => progress.push(patch),
    isCancelled: () => false,
    ...over,
  }
  return { deps: d, progress, waits }
}

const photo = { name: 'p.jpg', url: 'data:image/jpeg;base64,AAAA' }

/** Rows of the sheet that fall inside the strip, the table filling the photo. */
const rowsIn = (
  lines: string[],
  { top, bottom }: { top: number; bottom: number }
) =>
  lines.filter((_, index) => {
    const y = (index + 0.5) / lines.length
    return y >= top && y <= bottom
  })

describe('readStatementPhoto', () => {
  it('читає смугами: заголовки з першої, далі їх передає; зшиває без зауважень', async () => {
    const lines = sheet(28)
    const { deps: d } = deps((strip, columns) => ({
      ok: true,
      data: { columns: columns ?? COLUMNS, rows: rowsIn(lines, strip) },
    }))

    const result = await readStatementPhoto(photo, d)

    const calls = (d.readStrip as jest.Mock).mock.calls
    expect(calls[0][1]).toBeUndefined()
    calls.slice(1).forEach(([, columns]) => expect(columns).toEqual(COLUMNS))
    expect(result.strips.flat().length).toBeGreaterThanOrEqual(28)
    expect(result.issues).toEqual([])
  })

  it('на ліміті чекає, скільки сказав сервер, і продовжує', async () => {
    const lines = sheet(10)
    let limited = false
    const { deps: d, waits } = deps((strip, columns) => {
      if (!limited) {
        limited = true
        return { ok: false, kind: 'rate', retryAfter: 42 }
      }
      return {
        ok: true,
        data: { columns: columns ?? COLUMNS, rows: rowsIn(lines, strip) },
      }
    })

    const result = await readStatementPhoto(photo, {
      ...d,
      survey: async () => ({ ok: true, data: survey(10) }),
    })

    expect(waits).toEqual([42])
    expect(result.strips.flat()).toHaveLength(10)
  })

  it('задовгу смугу ділить навпіл', async () => {
    const lines = sheet(12)
    const { deps: d } = deps((strip, columns) =>
      strip.bottom - strip.top > 0.6
        ? { ok: false, kind: 'too-long' }
        : {
            ok: true,
            data: { columns: columns ?? COLUMNS, rows: rowsIn(lines, strip) },
          }
    )

    const result = await readStatementPhoto(photo, {
      ...d,
      survey: async () => ({ ok: true, data: survey(12) }),
    })

    expect(d.readStrip).toHaveBeenCalledTimes(3)
    expect(result.issues).toEqual([])
  })

  it('погано прочитані заголовки — перечитує ту саму смугу', async () => {
    const lines = sheet(8)
    let firstTitles = true
    const { deps: d } = deps((strip, columns) => {
      const titles = firstTitles ? ['???', 'Сума'] : COLUMNS
      firstTitles = false
      return {
        ok: true,
        data: { columns: columns ?? titles, rows: rowsIn(lines, strip) },
      }
    })

    const result = await readStatementPhoto(photo, {
      ...d,
      survey: async () => ({ ok: true, data: survey(8) }),
    })

    expect(d.readStrip).toHaveBeenCalledTimes(2)
    expect(result.strips.flat()).toHaveLength(8)
  })

  it('місяці, що випали на стику смуг, дочитує прицільно', async () => {
    const lines = sheet(28)
    // The main strips swallow months 13-14 at their seam; a re-read has them.
    const { deps: d } = deps((strip, columns) => {
      const rows = rowsIn(lines, strip)
      const narrow = strip.bottom - strip.top < 0.3
      return {
        ok: true,
        data: {
          columns: columns ?? COLUMNS,
          rows: narrow
            ? rows
            : rows.filter((line) => !/^(1|2)\/2025/.test(line)),
        },
      }
    })

    const result = await readStatementPhoto(photo, d)

    const months = new Set(
      result.strips.flat().map(({ year, month }) => `${year}-${month}`)
    )
    expect(months.has('2025-1')).toBe(true)
    expect(months.has('2025-2')).toBe(true)
  })

  it('не таблиця боргу — позначає й нічого не читає', async () => {
    const { deps: d, progress } = deps(() => ({ ok: true, data: null }))

    const result = await readStatementPhoto(photo, {
      ...d,
      survey: async () => ({
        ok: true,
        data: { ...survey(0), documentType: 'unknown' },
      }),
    })

    expect(result).toBeNull()
    expect(d.readStrip).not.toHaveBeenCalled()
    expect(progress).toContainEqual({ status: 'unrecognized' })
  })
})

describe('readStatementPhoto — спершу весь аркуш (Gemini)', () => {
  const page = (rows: string[], extra = {}) => ({
    ok: true,
    data: { ...survey(rows.length), columns: COLUMNS, rows, ...extra },
  })

  it('читає аркуш одним запитом — без огляду й смуг', async () => {
    const lines = sheet(28)
    const readPage = jest.fn(async () => page(lines))
    const { deps: d, progress } = deps(() => ({ ok: true, data: null }))

    const result = await readStatementPhoto(photo, { ...d, readPage })

    expect(readPage).toHaveBeenCalledTimes(1)
    expect(d.survey).not.toHaveBeenCalled()
    expect(d.readStrip).not.toHaveBeenCalled()
    expect(result.strips.flat()).toHaveLength(28)
    expect(result.issues).toEqual([])
    expect(progress).toContainEqual({ status: 'done', stripsTotal: 1 })
  })

  it('коли місяці під сумнівом — читає аркуш удруге і зливає', async () => {
    const lines = sheet(12)
    // First read drops 5/2024; the second has it.
    const readPage = jest
      .fn()
      .mockResolvedValueOnce(
        page(lines.filter((line) => !line.startsWith('5/2024')))
      )
      .mockResolvedValueOnce(page(lines))
    const { deps: d } = deps(() => ({ ok: true, data: null }))

    const result = await readStatementPhoto(photo, { ...d, readPage })

    expect(readPage).toHaveBeenCalledTimes(2)
    const months = new Set(result.strips.flat().map(({ month }) => month))
    expect(months.has(5)).toBe(true)
  })

  it('без читача аркуша (нема ключа Google) — безкоштовні смуги Groq', async () => {
    const lines = sheet(10)
    const readPage = jest.fn(async () => ({
      ok: false,
      kind: 'unavailable' as const,
    }))
    const { deps: d } = deps((strip, columns) => ({
      ok: true,
      data: { columns: columns ?? COLUMNS, rows: rowsIn(lines, strip) },
    }))

    const result = await readStatementPhoto(photo, {
      ...d,
      readPage,
      survey: jest.fn(async () => ({ ok: true, data: survey(10) })),
    })

    expect(d.readStrip).toHaveBeenCalled()
    expect(result.strips.flat()).toHaveLength(10)
  })

  it('не таблиця боргу — так і каже, без смуг', async () => {
    const readPage = jest.fn(async () => page([], { documentType: 'unknown' }))
    const { deps: d, progress } = deps(() => ({ ok: true, data: null }))

    const result = await readStatementPhoto(photo, { ...d, readPage })

    expect(result).toBeNull()
    expect(d.survey).not.toHaveBeenCalled()
    expect(progress).toContainEqual({ status: 'unrecognized' })
  })
})
