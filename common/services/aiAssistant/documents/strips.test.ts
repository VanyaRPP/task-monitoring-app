import { periodKey } from '@utils/debt-calculation/months'
import {
  planRereads,
  planStrips,
  REREAD_HALF_HEIGHT,
  splitStrip,
  STRIP_OVERLAP,
  suspectPeriods,
} from './strips'

const key = (year: number, month: number) => periodKey({ year, month })

describe('planStrips', () => {
  it('46 рядків — 4 смуги, що перекриваються й покривають усе фото', () => {
    const strips = planStrips(46)

    expect(strips).toHaveLength(4)
    expect(strips[0].top).toBe(0)
    expect(strips[strips.length - 1].bottom).toBe(1)
    strips.slice(1).forEach((strip, index) => {
      expect(strips[index].bottom - strip.top).toBeCloseTo(STRIP_OVERLAP * 2)
    })
  })

  it('коротка таблиця — одна смуга на все фото', () => {
    expect(planStrips(10)).toEqual([{ top: 0, bottom: 1 }])
    expect(planStrips(0)).toEqual([{ top: 0, bottom: 1 }])
  })
})

describe('splitStrip', () => {
  it('ділить навпіл з перекриттям', () => {
    const [top, bottom] = splitStrip({ top: 0.2, bottom: 0.6 })

    expect(top.top).toBe(0.2)
    expect(bottom.bottom).toBe(0.6)
    expect(top.bottom).toBeGreaterThan(bottom.top)
  })

  it('надто вузьку смугу не ділить', () => {
    expect(splitStrip({ top: 0.5, bottom: 0.6 })).toBeNull()
  })
})

describe('suspectPeriods', () => {
  const rows = [
    { year: 2024, month: 1 },
    { year: 2024, month: 2 },
    { year: 2024, month: 5 },
    { year: 2024, month: 6 },
  ]

  it('пропуск: сусіди з обох боків і всі відсутні місяці', () => {
    expect(suspectPeriods(rows, [{ kind: 'gap', period: '2024-05' }])).toEqual([
      key(2024, 2),
      key(2024, 3),
      key(2024, 4),
      key(2024, 5),
    ])
  })

  it('несхідний рядок — він сам; виправлені й нечитабельні — ні', () => {
    expect(
      suspectPeriods(rows, [
        { kind: 'arithmetic', period: '2024-01' },
        { kind: 'autocorrected', period: '2024-06' },
        { kind: 'unreadable' },
      ])
    ).toEqual([key(2024, 1)])
  })
})

describe('planRereads', () => {
  // Two strips; months 1-8 in the first, 9-16 in the second.
  const reads = [
    {
      strip: { top: 0, bottom: 0.5 },
      periods: Array.from({ length: 8 }, (_, i) => key(2024, i + 1)),
    },
    {
      strip: { top: 0.5, bottom: 1 },
      periods: Array.from({ length: 8 }, (_, i) => key(2024, i + 9)),
    },
  ]

  it('центрує вузьку смугу на підозрілому місяці', () => {
    const [strip] = planRereads(reads, [key(2024, 4)])
    const y = (3 + 0.5) / 8 / 2

    expect(strip.top).toBeCloseTo(y - REREAD_HALF_HEIGHT)
    expect(strip.bottom).toBeCloseTo(y + REREAD_HALF_HEIGHT)
  })

  it('знаходить місце відсутнього місяця між прочитаними й зливає близькі', () => {
    // A month missing between the strips, and its two neighbours.
    const strips = planRereads(reads, [
      key(2024, 8),
      key(2024, 9),
      key(2024, 16),
    ])

    expect(strips).toHaveLength(2)
    expect(strips[0].top).toBeLessThan(0.5)
    expect(strips[0].bottom).toBeGreaterThan(0.5)
  })
})
