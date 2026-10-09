/**
 * @jest-environment node
 */

import { readFileSync } from 'fs'
import { join } from 'path'

import { INFLATION_INDEXES } from '../../../scripts/seed-inflation-indexes'
import { parseMinfin } from './minfin'

const FIXTURE = readFileSync(
  join(__dirname, '__fixtures__/minfin.html'),
  'utf8'
)

const HEADER =
  '<tr><th></th>' +
  [
    'Січ',
    'Лют',
    'Бер',
    'Кві',
    'Тра',
    'Чер',
    'Лип',
    'Сер',
    'Вер',
    'Жов',
    'Лис',
    'Гру',
  ]
    .map((m) => `<th>${m}</th>`)
    .join('') +
  '<th>За рік</th></tr>'

const summaryTable = (year: string, cells: string[]) =>
  `<table>${HEADER}<tr><th>${year}</th>${cells
    .map((c) => `<td>${c}</td>`)
    .join('')}<th>108,0</th></tr></table>`

const twelve = (value: string) => Array(12).fill(value)

describe('parseMinfin на збереженій сторінці', () => {
  const items = parseMinfin(FIXTURE)
  const find = (year: number, month: number) =>
    items.find((item) => item.year === year && item.month === month)

  it('читає всі опубліковані місяці, від січ.2000 до сер.2026', () => {
    expect(items).toHaveLength(26 * 12 + 8)
    expect(items[0]).toEqual({ year: 2000, month: 1, value: 104.6 })
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

  it('перетворює десяткову кому і не губить піки', () => {
    expect(find(2015, 3)?.value).toBe(110.8)
    expect(find(2015, 4)?.value).toBe(114)
    expect(find(2023, 8)?.value).toBe(98.6)
  })

  it('пропускає ще не опубліковані місяці замість нулів', () => {
    expect(find(2026, 9)).toBeUndefined()
    expect(find(2026, 12)).toBeUndefined()
  })

  it('не бере річний підсумок за місяць', () => {
    expect(items.every(({ month }) => month >= 1 && month <= 12)).toBe(true)
  })
})

describe('parseMinfin на зміненій розмітці', () => {
  it('падає, якщо зведеної таблиці немає', () => {
    expect(() => parseMinfin('<html><body></body></html>')).toThrow(
      'знайдено 0'
    )
  })

  it('не бере транспоновану таблицю з таким самим підписом', () => {
    const transposed = FIXTURE.replace(/<table[\s\S]*?<\/table>/, '')

    expect(() => parseMinfin(transposed)).toThrow('знайдено 0')
  })

  it('падає, якщо колонки місяців переставлено', () => {
    const shuffled = summaryTable('2026', twelve('100,1')).replace(
      '<th>Січ</th><th>Лют</th>',
      '<th>Лют</th><th>Січ</th>'
    )

    expect(() => parseMinfin(shuffled)).toThrow('знайдено 0')
  })

  it('падає на нерозпізнаному значенні, а не пропускає його', () => {
    const cells = twelve('')
    cells[0] = '100,7'
    cells[1] = 'н/д'

    expect(() => parseMinfin(summaryTable('2026', cells))).toThrow(
      'нерозпізнане значення «н/д» за 2026-2'
    )
  })

  it('падає на рядку без року', () => {
    expect(() => parseMinfin(summaryTable('Разом', twelve('100,1')))).toThrow(
      'нерозпізнаний рядок'
    )
  })

  it('падає, якщо в таблиці жодного значення', () => {
    expect(() => parseMinfin(summaryTable('2026', twelve('')))).toThrow(
      'порожня'
    )
  })

  it('приймає крапку як десятковий роздільник', () => {
    const cells = twelve('')
    cells[8] = '100.4'

    expect(parseMinfin(summaryTable('2026', cells))).toEqual([
      { year: 2026, month: 9, value: 100.4 },
    ])
  })
})
