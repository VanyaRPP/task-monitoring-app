/**
 * @jest-environment node
 */

import { readFileSync } from 'fs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'
import { join } from 'path'

import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import CustomService from '@modules/models/CustomService'
import InflationIndex from '@modules/models/InflationIndex'
import Service from '@modules/models/Service'
import * as fillServices from './fill-services'
import { INFLATION_INDEXES } from '../../scripts/seed-inflation-indexes'
import {
  formatSyncReport,
  hasProblems,
  IIndexSourceConfig,
  ISyncReport,
  SOURCES,
  syncInflationIndexes,
} from './sync'

jest.setTimeout(120000)

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } })
  await mongoose.connect(mongo.getUri())
  await InflationIndex.syncIndexes()
}, 120000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

afterEach(async () => {
  await InflationIndex.deleteMany({})
})

const FIXTURES: Record<string, string> = Object.fromEntries(
  SOURCES.map(({ name, url }) => [
    url,
    readFileSync(
      join(__dirname, 'sources/__fixtures__', `${name}.html`),
      'utf8'
    ),
  ])
)

const fixtureFetch = async (url: string) => FIXTURES[url]

const seedExcept = (...skip: string[]) =>
  InflationIndex.insertMany(
    INFLATION_INDEXES.filter(([y, m]) => !skip.includes(`${y}-${m}`)).map(
      ([year, month, value]) => ({ year, month, value })
    )
  )

const stubSource = (
  name: string,
  items: IInflationIndexInput[]
): IIndexSourceConfig => ({ name, url: name, parse: () => items })

const stubFetch = async () => ''

const findMonth = (year: number, month: number) =>
  InflationIndex.findOne({ year, month }).lean()

describe('syncInflationIndexes на збережених сторінках', () => {
  it('дописує новий місяць, на якому зійшлися обидва сайти', async () => {
    await seedExcept('2026-8')

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report).toEqual({
      added: [{ year: 2026, month: 8, value: 100.1 }],
      mismatched: [],
      rejected: [],
      failedSources: [],
      servicesFilled: 0,
      fillFailures: [],
    })
    expect(await findMonth(2026, 8)).toMatchObject({
      value: 100.1,
      source: 'auto',
    })
  })

  it('коли довідник актуальний, нічого не робить', async () => {
    await seedExcept()

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report.added).toEqual([])
    expect(report.mismatched).toEqual([])
    expect(await InflationIndex.countDocuments()).toBe(INFLATION_INDEXES.length)
  })

  it('заповнює дірку всередині довідника', async () => {
    await seedExcept('2024-5', '2026-8')

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report.added).toEqual([
      { year: 2024, month: 5, value: 100.6 },
      { year: 2026, month: 8, value: 100.1 },
    ])
  })

  it('не дописує історію раніше за перший місяць довідника', async () => {
    await seedExcept()

    await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(await findMonth(2014, 12)).toBeNull()
    expect(await findMonth(2014, 1)).toBeNull()
  })

  it('не чіпає ручну правку наявного місяця', async () => {
    await seedExcept('2026-8')
    await InflationIndex.create({
      year: 2026,
      month: 8,
      value: 100.5,
      source: 'manual',
    })

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report.added).toEqual([])
    expect(await findMonth(2026, 8)).toMatchObject({
      value: 100.5,
      source: 'manual',
    })
  })
})

describe('syncInflationIndexes, коли щось пішло не так', () => {
  beforeEach(() => seedExcept('2026-8'))

  it('недоступне джерело: місяць лишається непідтвердженим і не пишеться', async () => {
    const report = await syncInflationIndexes(SOURCES, async (url) => {
      if (url === SOURCES[1].url) throw new Error('HTTP 503')
      return FIXTURES[url]
    })

    expect(report.added).toEqual([])
    expect(report.failedSources).toEqual([
      { source: 'buhgalter', error: 'HTTP 503' },
    ])
    expect(report.mismatched).toEqual([
      {
        year: 2026,
        month: 8,
        reason: 'unconfirmed',
        values: [{ source: 'minfin', value: 100.1 }],
      },
    ])
    expect(await findMonth(2026, 8)).toBeNull()
  })

  it('змінена розмітка: помилку парсера видно у звіті', async () => {
    const report = await syncInflationIndexes(SOURCES, async (url) =>
      url === SOURCES[0].url ? '<html>редизайн</html>' : FIXTURES[url]
    )

    expect(report.failedSources).toEqual([
      {
        source: 'minfin',
        error: 'minfin: очікувалась одна зведена таблиця ІСЦ, знайдено 0',
      },
    ])
    expect(report.added).toEqual([])
  })

  it('розбіжність між джерелами: місяць не пишеться', async () => {
    const report = await syncInflationIndexes(
      [
        stubSource('a', [{ year: 2026, month: 8, value: 100.1 }]),
        stubSource('b', [{ year: 2026, month: 8, value: 100.8 }]),
      ],
      stubFetch
    )

    expect(report.added).toEqual([])
    expect(report.mismatched[0]).toMatchObject({ reason: 'conflict' })
    expect(await findMonth(2026, 8)).toBeNull()
  })

  it('значення поза 90–120: відкидається, навіть якщо джерела згодні', async () => {
    const broken = [{ year: 2026, month: 8, value: 1001 }]

    const report = await syncInflationIndexes(
      [stubSource('a', broken), stubSource('b', broken)],
      stubFetch
    )

    expect(report.added).toEqual([])
    expect(report.rejected).toEqual(broken)
    expect(await findMonth(2026, 8)).toBeNull()
  })

  it('на порожньому довіднику падає, а не заливає історію з 2000 року', async () => {
    await InflationIndex.deleteMany({})

    await expect(syncInflationIndexes(SOURCES, fixtureFetch)).rejects.toThrow(
      'Довідник ІСЦ порожній'
    )
    expect(await InflationIndex.countDocuments()).toBe(0)
  })
})

describe('syncInflationIndexes заповнює місячні послуги', () => {
  const AUGUST = new Date('2026-07-31T21:00:00.000Z')
  const SEPTEMBER = new Date('2026-08-31T21:00:00.000Z')

  let domain: Types.ObjectId

  beforeEach(async () => {
    await seedExcept('2026-8')
    domain = new Types.ObjectId()
    await CustomService.collection.insertOne({
      name: 'Інфляція',
      fieldName: 'inflicionPrice',
      serviceType: 'inflicionPrice',
      domain,
    })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await Promise.all([Service.deleteMany({}), CustomService.deleteMany({})])
  })

  const insertService = async (date: Date, inflicionPrice: number) =>
    (
      await Service.collection.insertOne({
        domain,
        date,
        rentPrice: 25,
        inflicionPrice,
      })
    ).insertedId

  const indexOf = async (id: Types.ObjectId) =>
    (await Service.findById(id).lean())?.inflicionPrice

  it('заповнює порожнє поле щойно доданого місяця', async () => {
    const august = await insertService(AUGUST, 0)

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report.servicesFilled).toBe(1)
    expect(await indexOf(august)).toBe(100.1)
  })

  it('не чіпає ручне значення', async () => {
    const august = await insertService(AUGUST, 100.5)

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report.servicesFilled).toBe(0)
    expect(await indexOf(august)).toBe(100.5)
  })

  it('місяць, якого немає в довіднику, лишається порожнім', async () => {
    const september = await insertService(SEPTEMBER, 0)

    await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(await findMonth(2026, 9)).toBeNull()
    expect(await indexOf(september)).toBe(0)
  })

  it('без нових місяців послуги не чіпає', async () => {
    await InflationIndex.create({ year: 2026, month: 8, value: 100.1 })
    const august = await insertService(AUGUST, 0)

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report.added).toEqual([])
    expect(await indexOf(august)).toBe(0)
  })

  it('збій заповнення видно у звіті, а індекс однаково записаний', async () => {
    jest
      .spyOn(fillServices, 'fillServicesInflation')
      .mockRejectedValue(new Error('timeout'))

    const report = await syncInflationIndexes(SOURCES, fixtureFetch)

    expect(report.added).toEqual([{ year: 2026, month: 8, value: 100.1 }])
    expect(report.fillFailures).toEqual([
      { year: 2026, month: 8, error: 'timeout' },
    ])
    expect(hasProblems(report)).toBe(true)
    expect(formatSyncReport(report)).toContain(
      'не вдалося заповнити послуги за 2026-08: timeout'
    )
  })
})

describe('hasProblems і formatSyncReport', () => {
  const empty: ISyncReport = {
    added: [],
    mismatched: [],
    rejected: [],
    failedSources: [],
    servicesFilled: 0,
    fillFailures: [],
  }
  const unconfirmed = {
    year: 2026,
    month: 9,
    reason: 'unconfirmed' as const,
    values: [{ source: 'minfin', value: 100.4 }],
  }

  it('непідтверджений місяць — не проблема: один сайт просто запізнюється', () => {
    expect(hasProblems({ ...empty, mismatched: [unconfirmed] })).toBe(false)
  })

  it('конфлікт, відкинуте значення чи зламане джерело — проблема', () => {
    expect(
      hasProblems({
        ...empty,
        mismatched: [{ ...unconfirmed, reason: 'conflict' }],
      })
    ).toBe(true)
    expect(
      hasProblems({
        ...empty,
        rejected: [{ year: 2026, month: 9, value: 1004 }],
      })
    ).toBe(true)
    expect(
      hasProblems({
        ...empty,
        failedSources: [{ source: 'minfin', error: 'HTTP 503' }],
      })
    ).toBe(true)
  })

  it('пише підсумок і кожну деталь окремим рядком', () => {
    const text = formatSyncReport({
      added: [{ year: 2026, month: 8, value: 100.1 }],
      mismatched: [unconfirmed],
      rejected: [{ year: 2026, month: 7, value: 1003 }],
      failedSources: [{ source: 'buhgalter', error: 'HTTP 503' }],
      servicesFilled: 0,
      fillFailures: [],
    })

    expect(text.split('\n')).toEqual([
      '[cron:monthly] ІСЦ: додано 1, розбіжностей 1, відкинуто 1, джерел з помилкою 1',
      '  додано: 2026-08=100.1',
      '  unconfirmed 2026-09: minfin=100.4',
      '  поза діапазоном 90–120: 2026-07=1003',
      '  джерело buhgalter недоступне: HTTP 503',
    ])
  })
})
