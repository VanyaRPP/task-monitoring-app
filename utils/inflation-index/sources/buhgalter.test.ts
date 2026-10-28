/**
 * @jest-environment node
 */

import { readFileSync } from 'fs'
import { join } from 'path'

import { INFLATION_INDEXES } from '../../../scripts/seed-inflation-indexes'
import { parseBuhgalter } from './buhgalter'
import { parseMinfin } from './minfin'

const fixture = (name: string) =>
  readFileSync(join(__dirname, '__fixtures__', name), 'utf8')

const FIXTURE = fixture('buhgalter.html')

const MONTHS = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
]

const indexTable = (years: string[], rows: [string, string[]][]) => {
  const tr = (cells: string[]) =>
    `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`
  return `<table><tbody>${tr(['&nbsp;', ...years])}${rows
    .map(([label, cells]) => tr([label, ...cells]))
    .join('')}</tbody></table>`
}

const fullYear = (years: string[], value = '100,1'): [string, string[]][] =>
  MONTHS.map((m) => [m, years.map(() => value)])

describe('parseBuhgalter на збереженій сторінці', () => {
  const items = parseBuhgalter(FIXTURE)
  const find = (year: number, month: number) =>
    items.find((item) => item.year === year && item.month === month)

  it('читає всі опубліковані місяці, від січ.2014 до сер.2026', () => {
    expect(items).toHaveLength(12 * 12 + 8)
    expect(items[0]).toEqual({ year: 2014, month: 1, value: 100.2 })
    expect(items[items.length - 1]).toEqual({
      year: 2026,
      month: 8,
      value: 100.1,
    })
  })

  it('збігається з уже звіреним seed-довідником на всіх 58 місяцях', () => {
    INFLATION_INDEXES.forEach(([year, month, value]) => {
      expect(find(year, month)?.value).toBe(value)
    })
  })

  it('збігається з minfin на кожному спільному місяці', () => {
    const minfin = new Map(
      parseMinfin(fixture('minfin.html')).map(({ year, month, value }) => [
        `${year}-${month}`,
        value,
      ])
    )

    items.forEach(({ year, month, value }) => {
      expect([`${year}-${month}`, minfin.get(`${year}-${month}`)]).toEqual([
        `${year}-${month}`,
        value,
      ])
    })
  })

  it('пропускає ще не опубліковані місяці', () => {
    expect(find(2026, 9)).toBeUndefined()
    expect(find(2026, 12)).toBeUndefined()
  })

  it('не бере рядки «Всього за рік» і «Середньомісячний темп росту»', () => {
    expect(items.some(({ value }) => value === 143.3)).toBe(false)
  })
})

describe('parseBuhgalter на зміненій розмітці', () => {
  it('падає, якщо таблиці з роками немає', () => {
    expect(() => parseBuhgalter('<table><tr><td>x</td></tr></table>')).toThrow(
      'знайдено 0'
    )
  })

  it('падає на рядку, де бракує клітинки, — так виглядає зсув', () => {
    const rows = fullYear(['2025', '2026'])
    rows[7] = ['Серпень', ['99,8']]

    expect(() => parseBuhgalter(indexTable(['2025', '2026'], rows))).toThrow(
      'у рядку «Серпень» 1 клітинок на 2 років'
    )
  })

  it('падає, якщо якогось місяця немає', () => {
    const rows = fullYear(['2026']).filter(([m]) => m !== 'Березень')

    expect(() => parseBuhgalter(indexTable(['2026'], rows))).toThrow(
      'знайдено 11 з 12 місяців'
    )
  })

  it('падає, якщо місяць трапився двічі', () => {
    const rows = fullYear(['2026'])
    rows.push(['Січень', ['100,7']])

    expect(() => parseBuhgalter(indexTable(['2026'], rows))).toThrow(
      'трапився двічі'
    )
  })

  it('падає на нерозпізнаному значенні', () => {
    const rows = fullYear(['2026'])
    rows[1] = ['Лютий', ['101.0*']]

    expect(() => parseBuhgalter(indexTable(['2026'], rows))).toThrow(
      'нерозпізнане значення «101.0*» за 2026-2'
    )
  })

  it('падає, якщо в таблиці жодного значення', () => {
    expect(() =>
      parseBuhgalter(indexTable(['2026'], fullYear(['2026'], '')))
    ).toThrow('порожня')
  })

  it('повертає місяці впорядкованими за періодом', () => {
    const items = parseBuhgalter(
      indexTable(['2025', '2026'], fullYear(['2025', '2026']))
    )

    expect(items.slice(11, 13)).toEqual([
      { year: 2025, month: 12, value: 100.1 },
      { year: 2026, month: 1, value: 100.1 },
    ])
  })
})
