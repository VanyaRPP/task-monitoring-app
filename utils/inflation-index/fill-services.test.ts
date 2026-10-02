/**
 * @jest-environment node
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'

import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import Service from '@modules/models/Service'
import { fillServicesInflation } from './fill-services'

jest.setTimeout(120000)

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } })
  await mongoose.connect(mongo.getUri())
}, 120000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

afterEach(async () => {
  await Promise.all([
    Service.deleteMany({}),
    Domain.deleteMany({}),
    CustomService.deleteMany({}),
  ])
})

const AUGUST = new Date('2026-07-31T21:00:00.000Z')
const SEPTEMBER = new Date('2026-08-31T21:00:00.000Z')
const OCTOBER = new Date('2026-09-30T21:00:00.000Z')

const SEPTEMBER_CPI = { year: 2026, month: 9, value: 100.4 }

const domainWithInflation = async () => {
  const domain = new Types.ObjectId()
  await CustomService.collection.insertOne({
    name: 'Інфляція',
    fieldName: 'inflicionPrice',
    serviceType: 'inflicionPrice',
    domain,
  })
  return domain
}

const inflationRow = (price: number) => ({
  _id: new Types.ObjectId(),
  label: 'Інфляція',
  fieldName: 'inflicionPrice',
  price,
})

const rentRow = {
  _id: new Types.ObjectId(),
  label: 'Оренда',
  fieldName: 'rentPrice',
  price: 25,
}

const insertService = async (doc: Record<string, unknown>) => {
  const { insertedId } = await Service.collection.insertOne({
    street: new Types.ObjectId(),
    rentPrice: 25,
    ...doc,
  })
  return insertedId
}

const load = (_id: Types.ObjectId) => Service.findById(_id).lean()

describe('fillServicesInflation', () => {
  it('заповнює порожнє поле в обох місцях', async () => {
    const domain = await domainWithInflation()
    const id = await insertService({
      domain,
      date: SEPTEMBER,
      inflicionPrice: 0,
      customServices: [rentRow, inflationRow(0)],
    })

    expect(await fillServicesInflation(SEPTEMBER_CPI)).toBe(1)

    const service = await load(id)
    expect(service?.inflicionPrice).toBe(100.4)
    expect(service?.customServices).toEqual([
      expect.objectContaining({ fieldName: 'rentPrice', price: 25 }),
      expect.objectContaining({ fieldName: 'inflicionPrice', price: 100.4 }),
    ])
  })

  it('не чіпає значення, вписане адміном', async () => {
    const domain = await domainWithInflation()
    const id = await insertService({
      domain,
      date: SEPTEMBER,
      inflicionPrice: 101,
      customServices: [inflationRow(101)],
    })

    expect(await fillServicesInflation(SEPTEMBER_CPI)).toBe(0)
    expect((await load(id))?.inflicionPrice).toBe(101)
  })

  it('не чіпає, якщо значення є хоча б у customServices', async () => {
    const domain = await domainWithInflation()
    const id = await insertService({
      domain,
      date: SEPTEMBER,
      inflicionPrice: 0,
      customServices: [inflationRow(101)],
    })

    await fillServicesInflation(SEPTEMBER_CPI)

    const service = await load(id)
    expect(service?.inflicionPrice).toBe(0)
    expect(service?.customServices?.[0].price).toBe(101)
  })

  it('заповнює стару послугу без customServices', async () => {
    const domain = await domainWithInflation()
    const id = await insertService({ domain, date: SEPTEMBER })

    expect(await fillServicesInflation(SEPTEMBER_CPI)).toBe(1)
    expect((await load(id))?.inflicionPrice).toBe(100.4)
  })

  it('бере місяць за київським часом, не за UTC', async () => {
    const domain = await domainWithInflation()
    const august = await insertService({
      domain,
      date: AUGUST,
      inflicionPrice: 0,
    })
    const september = await insertService({
      domain,
      date: SEPTEMBER,
      inflicionPrice: 0,
    })
    const october = await insertService({
      domain,
      date: OCTOBER,
      inflicionPrice: 0,
    })

    await fillServicesInflation(SEPTEMBER_CPI)

    expect((await load(august))?.inflicionPrice).toBe(0)
    expect((await load(september))?.inflicionPrice).toBe(100.4)
    expect((await load(october))?.inflicionPrice).toBe(0)
  })

  it('не чіпає домени без послуги «Інфляція»', async () => {
    await domainWithInflation()
    const id = await insertService({
      domain: new Types.ObjectId(),
      date: SEPTEMBER,
      inflicionPrice: 0,
    })

    expect(await fillServicesInflation(SEPTEMBER_CPI)).toBe(0)
    expect((await load(id))?.inflicionPrice).toBe(0)
  })

  it('знаходить домен, що посилається на глобальну послугу «Інфляція»', async () => {
    const domain = new Types.ObjectId()
    await Domain.collection.insertOne({
      _id: domain,
      name: 'Старий домен',
      customServices: [
        { groupName: 'Комунальні', services: ['68230f76a51fddf0ae165d77'] },
      ],
    })
    const id = await insertService({
      domain,
      date: SEPTEMBER,
      inflicionPrice: 0,
    })

    expect(await fillServicesInflation(SEPTEMBER_CPI)).toBe(1)
    expect((await load(id))?.inflicionPrice).toBe(100.4)
  })

  it('повторний запуск нічого не міняє', async () => {
    const domain = await domainWithInflation()
    await insertService({ domain, date: SEPTEMBER, inflicionPrice: 0 })

    await fillServicesInflation(SEPTEMBER_CPI)

    expect(await fillServicesInflation({ ...SEPTEMBER_CPI, value: 99 })).toBe(0)
  })
})
