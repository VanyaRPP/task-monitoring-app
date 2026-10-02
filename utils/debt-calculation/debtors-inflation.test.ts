/**
 * @jest-environment node
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'

import CustomService from '@modules/models/CustomService'
import DebtCalculation from '@modules/models/DebtCalculation'
import InflationIndex from '@modules/models/InflationIndex'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import { buildDebtCalculationInput, indexesByPeriod } from './build-input'
import { calculateDebt } from './calculate'
import { calculateDebtorsInflation } from './debtors-inflation'
import { buildMonthPrefill } from './prefill'

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
  await Promise.all(
    [
      CustomService,
      DebtCalculation,
      InflationIndex,
      Payment,
      RealEstate,
      Service,
    ].map((model) => (model as mongoose.Model<unknown>).deleteMany({}))
  )
})

const kyivMonthStart = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1) - 2 * 60 * 60 * 1000)

const INDEXES = [
  { year: 2025, month: 1, value: 101.2 },
  { year: 2025, month: 2, value: 100.8 },
  { year: 2025, month: 3, value: 101.5 },
]

const NOW = new Date('2025-04-10T09:00:00.000Z')

interface IFixture {
  domain: Types.ObjectId
  company: Types.ObjectId
}

const seed = async ({ housingFee = true } = {}): Promise<IFixture> => {
  const domain = new Types.ObjectId()
  const company = new Types.ObjectId()

  if (housingFee) {
    await CustomService.collection.insertOne({
      name: 'Квартплата',
      fieldName: 'housingFeePrice',
      serviceType: 'housingFeePrice',
      domain,
    })
  }
  await RealEstate.collection.insertOne({
    _id: company,
    domain,
    companyName: 'Квартира 1',
    totalArea: 0,
    pricePerMeter: 0,
  })
  await InflationIndex.insertMany(INDEXES)

  for (const month of [1, 2, 3]) {
    const { insertedId: monthService } = await Service.collection.insertOne({
      domain,
      date: kyivMonthStart(2025, month),
      rentPrice: 10,
    })
    await Payment.collection.insertOne({
      domain,
      company,
      type: 'debit',
      generalSum: 500,
      invoiceCreationDate: new Date(Date.UTC(2025, month - 1, 5)),
      monthService,
      invoice: [{ type: 'housingFeePrice', sum: 500 }],
    })
  }

  return { domain, company }
}

const viaPage = async (
  { domain, company }: IFixture,
  settings: Parameters<typeof buildDebtCalculationInput>[0]
) => {
  const payments = await Payment.find({ domain, company })
    .populate('monthService')
    .lean()
  const services = await Service.find({ domain }).sort({ date: -1 }).lean()
  const indexes = await InflationIndex.find().lean()

  return calculateDebt(
    buildDebtCalculationInput({
      company: { totalArea: 0, pricePerMeter: 0 },
      indexByPeriod: indexesByPeriod(indexes),
      prefillMonths: buildMonthPrefill({
        companyId: String(company),
        payments: payments as never,
        services: services as never,
        timeZone: 'Europe/Kyiv',
      }),
      ...settings,
    })
  ).inflation
}

describe('calculateDebtorsInflation', () => {
  it('збігається з ручним розрахунком і з двигуном сторінки', async () => {
    const fixture = await seed()
    await DebtCalculation.create({
      domain: fixture.domain,
      company: fixture.company,
      periodFrom: { year: 2025, month: 1 },
      periodTo: { year: 2025, month: 3 },
      inflationMethod: 'balance',
    })

    const result = await calculateDebtorsInflation(
      [String(fixture.company)],
      NOW
    )
    const expected = await viaPage(fixture, {
      from: { year: 2025, month: 1 },
      to: { year: 2025, month: 3 },
      inflationMethod: 'balance',
    })

    expect(expected).toBeCloseTo(34.68, 2)
    expect(result[String(fixture.company)]).toEqual({
      loss: expected,
      from: '2025-01',
      to: '2025-03',
      method: 'balance',
    })
  })

  it('без збереженого розрахунку бере період, з яким відкривається сторінка', async () => {
    const fixture = await seed()

    const result = await calculateDebtorsInflation(
      [String(fixture.company)],
      NOW
    )
    const expected = await viaPage(fixture, {
      from: { year: 2024, month: 4 },
      to: { year: 2025, month: 3 },
      inflationMethod: 'balance',
    })

    expect(result[String(fixture.company)]).toEqual({
      loss: expected,
      from: '2024-04',
      to: '2025-03',
      method: 'balance',
    })
  })

  it('враховує метод і ручні правки зі збереженого розрахунку', async () => {
    const fixture = await seed()
    const overrides = { months: { '2025-03': { inflationIndex: 103 } } }
    await DebtCalculation.create({
      domain: fixture.domain,
      company: fixture.company,
      periodFrom: { year: 2025, month: 1 },
      periodTo: { year: 2025, month: 3 },
      inflationMethod: 'monthly',
      overrides: { [String(fixture.company)]: overrides },
    })

    const result = await calculateDebtorsInflation(
      [String(fixture.company)],
      NOW
    )
    const expected = await viaPage(fixture, {
      from: { year: 2025, month: 1 },
      to: { year: 2025, month: 3 },
      inflationMethod: 'monthly',
      overrides,
    })

    expect(result[String(fixture.company)].loss).toBe(expected)
    expect(result[String(fixture.company)].method).toBe('monthly')
  })

  it('компанії поза доменами з «Квартплатою» не рахує', async () => {
    const fixture = await seed({ housingFee: false })

    expect(
      await calculateDebtorsInflation([String(fixture.company)], NOW)
    ).toEqual({})
  })

  it('на порожньому списку в базу не йде', async () => {
    const spy = jest.spyOn(RealEstate, 'find')

    expect(await calculateDebtorsInflation([], NOW)).toEqual({})
    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})
