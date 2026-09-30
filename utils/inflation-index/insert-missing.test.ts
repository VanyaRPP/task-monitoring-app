/**
 * @jest-environment node
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

import InflationIndex from '@modules/models/InflationIndex'
import { insertMissingIndexes } from './insert-missing'

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

const findMonth = (year: number, month: number) =>
  InflationIndex.findOne({ year, month }).lean()

describe('insertMissingIndexes', () => {
  it('додає відсутні місяці з позначкою auto', async () => {
    const added = await insertMissingIndexes([
      { year: 2026, month: 9, value: 100.4 },
      { year: 2026, month: 10, value: 100.9 },
    ])

    expect(added).toEqual([
      { year: 2026, month: 9, value: 100.4 },
      { year: 2026, month: 10, value: 100.9 },
    ])
    expect(await findMonth(2026, 9)).toMatchObject({
      value: 100.4,
      source: 'auto',
    })
    expect(await findMonth(2026, 10)).toMatchObject({
      value: 100.9,
      source: 'auto',
    })
  })

  it('не чіпає наявний місяць, навіть якщо значення інше', async () => {
    await InflationIndex.create({
      year: 2026,
      month: 8,
      value: 100.1,
      source: 'manual',
    })

    const added = await insertMissingIndexes([
      { year: 2026, month: 8, value: 105.5 },
    ])

    expect(added).toEqual([])
    expect(await findMonth(2026, 8)).toMatchObject({
      value: 100.1,
      source: 'manual',
    })
  })

  it('не додає source записам, засіяним до появи поля', async () => {
    await InflationIndex.collection.insertOne({
      year: 2026,
      month: 7,
      value: 100.3,
    })

    await insertMissingIndexes([{ year: 2026, month: 7, value: 99 }])

    const row = await findMonth(2026, 7)
    expect(row?.value).toBe(100.3)
    expect(row).not.toHaveProperty('source')
  })

  it('у змішаному списку повертає лише додані місяці', async () => {
    await InflationIndex.create({ year: 2026, month: 8, value: 100.1 })

    const added = await insertMissingIndexes([
      { year: 2026, month: 7, value: 100.3 },
      { year: 2026, month: 8, value: 100.1 },
      { year: 2026, month: 9, value: 100.4 },
    ])

    expect(added).toEqual([
      { year: 2026, month: 7, value: 100.3 },
      { year: 2026, month: 9, value: 100.4 },
    ])
    expect(await InflationIndex.countDocuments()).toBe(3)
  })

  it('ідемпотентний: повторний запуск нічого не додає', async () => {
    const items = [{ year: 2026, month: 9, value: 100.4 }]

    await insertMissingIndexes(items)
    const second = await insertMissingIndexes(items)

    expect(second).toEqual([])
    expect(await InflationIndex.countDocuments()).toBe(1)
  })

  it('на порожньому списку не йде в базу', async () => {
    const spy = jest.spyOn(InflationIndex, 'bulkWrite')

    expect(await insertMissingIndexes([])).toEqual([])
    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})
