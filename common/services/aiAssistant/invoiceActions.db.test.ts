import mongoose from 'mongoose'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, streets, users } from '@utils/testData'
import CustomService from '@modules/models/CustomService'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildInvoiceDraft } from './invoiceActions'

setupTestEnvironment()

const globalAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: false,
  isGlobalAdmin: true,
  user: { email: 'ga@example.com' },
}

const domainId = domains[0]._id
const noStreetCompanyId = new mongoose.Types.ObjectId().toString()

// A month no testData service falls into.
const year = 2030
const month = 3
const inMonth = new Date(Date.UTC(year, month - 1, 10, 12))

async function addCompanyWithoutStreet() {
  const { street: _street, ...company } = realEstates[0]
  await RealEstate.create({
    ...company,
    _id: noStreetCompanyId,
    companyName: 'no street co',
    archived: false,
  })
}

async function addService(street: string | undefined, rentPrice: number) {
  return Service.create({
    domain: domainId,
    ...(street ? { street } : {}),
    date: inMonth,
    rentPrice,
    electricityPrice: 0,
    waterPrice: 0,
    waterPriceTotal: 0,
    description: '',
  })
}

describe('buildInvoiceDraft against the database', () => {
  beforeEach(addCompanyWithoutStreet)

  it('writes nothing when the month has no Service yet', async () => {
    const before = await Service.countDocuments()

    const draft = await buildInvoiceDraft({
      companyId: noStreetCompanyId,
      year,
      month,
      ctx: globalAdmin,
    })

    expect(await Service.countDocuments()).toBe(before)
    expect(draft.monthService).toBeNull()
    expect(draft.period).toEqual({ year, month })
  })

  it("does not take another street's tariffs for a company without a street", async () => {
    await addService(streets[1]._id, 999)

    const draft = await buildInvoiceDraft({
      companyId: noStreetCompanyId,
      year,
      month,
      ctx: globalAdmin,
    })

    expect(draft.monthService).toBeNull()
  })

  it('uses the street-less Service of that month for such a company', async () => {
    await addService(streets[1]._id, 999)
    const own = await addService(undefined, 10)

    const draft = await buildInvoiceDraft({
      companyId: noStreetCompanyId,
      year,
      month,
      ctx: globalAdmin,
    })

    expect(draft.monthService).toBe(own._id.toString())
  })

  it("uses the company street's Service when the company has one", async () => {
    const companyId = realEstates[0]._id
    await addService(undefined, 10)
    const own = await addService(realEstates[0].street, 20)

    const draft = await buildInvoiceDraft({
      companyId,
      year,
      month,
      ctx: globalAdmin,
    })

    expect(draft.monthService).toBe(own._id.toString())
  })
})

describe('buildInvoiceDraft lines', () => {
  // realEstates[0]: domains[0], street streets[0].
  const companyId = realEstates[0]._id
  const street = realEstates[0].street

  // The form only keeps lines of services in the domain's catalog; give
  // domains[0] electricity, as a real domain gets from its template.
  beforeEach(() =>
    CustomService.create({
      name: 'Електроенергія',
      fieldName: 'electricityPrice',
      domain: domainId,
    })
  )

  const addMonthService = (m: number, extra: Record<string, unknown> = {}) =>
    Service.create({
      domain: domainId,
      street,
      date: new Date(Date.UTC(year, m - 1, 1, 12)),
      rentPrice: 0,
      electricityPrice: 5,
      waterPrice: 0,
      waterPriceTotal: 0,
      description: '',
      ...extra,
    })

  const addDebit = (
    monthService: unknown,
    issued: Date,
    electricityReading: number
  ) =>
    Payment.create({
      invoiceNumber: 9000 + electricityReading,
      type: 'debit',
      domain: domainId,
      street,
      company: companyId,
      monthService,
      invoiceCreationDate: issued,
      description: '',
      invoice: [
        {
          type: 'electricityPrice',
          amount: electricityReading,
          price: 5,
          sum: 0,
        },
      ],
      generalSum: 0,
      currency: 'UAH',
    })

  it("reads previous meters from last month's invoice, even one issued late", async () => {
    const february = await addMonthService(2)
    await addMonthService(3)
    // January's invoice issued in February, and February's issued in March:
    // by issue date the "previous" one would be the January invoice.
    const january = await addMonthService(1)
    await addDebit(january._id, new Date(Date.UTC(year, 1, 5)), 100)
    // Saved through the API, so the month service id is a string.
    await addDebit(
      february._id.toString(),
      new Date(Date.UTC(year, 2, 20)),
      250
    )

    const draft = await buildInvoiceDraft({
      companyId,
      year,
      month,
      ctx: globalAdmin,
    })

    const electricity = draft.invoice.find(
      (line) => line.type === 'electricityPrice'
    )
    expect(electricity).toMatchObject({ lastAmount: 250, price: 5 })
  })

  it('appends the extra lines and adds them up in kopecks', async () => {
    await addMonthService(3)

    const draft = await buildInvoiceDraft({
      companyId,
      year,
      month,
      extraLines: [
        { name: 'Оренда', sum: 0.1 },
        { name: 'Парковка', sum: 0.2 },
      ],
      ctx: globalAdmin,
    })

    expect(draft.extraLines.map(({ name }) => name)).toEqual([
      'Оренда',
      'Парковка',
    ])
    expect(draft.invoice.slice(-2)).toEqual(draft.extraLines)
    const tariffs = draft.invoice
      .slice(0, -2)
      .reduce((total, line) => total + Number(line.sum), 0)
    expect(draft.generalSum).toBeCloseTo(tariffs + 0.3, 2)
  })

  it('keeps an empty meter line so the form can take the new reading', async () => {
    await addMonthService(3)

    const draft = await buildInvoiceDraft({
      companyId,
      year,
      month,
      ctx: globalAdmin,
    })

    expect(draft.invoice.some((l) => l.type === 'electricityPrice')).toBe(true)
  })

  it('refuses a company the user may not bill, even by a known id', async () => {
    await expect(
      buildInvoiceDraft({
        companyId: realEstates[1]._id,
        year,
        month,
        ctx: {
          isUser: false,
          isDomainAdmin: true,
          isGlobalAdmin: false,
          user: { email: users.domainAdmin.email },
        },
      })
    ).rejects.toThrow('company not accessible')
  })
})

it('finds last month invoice whichever way its month service id was stored', async () => {
  const street = realEstates[0].street
  await CustomService.create({
    name: 'Електроенергія',
    fieldName: 'electricityPrice',
    domain: domainId,
  })
  const february = await Service.create({
    domain: domainId,
    street,
    date: new Date(Date.UTC(year, 1, 1, 12)),
    rentPrice: 0,
    electricityPrice: 5,
    waterPrice: 0,
    waterPriceTotal: 0,
    description: '',
  })
  await Payment.create({
    invoiceNumber: 9300,
    type: 'debit',
    domain: domainId,
    street,
    company: realEstates[0]._id,
    // Written server-side: an ObjectId, not a string.
    monthService: february._id,
    invoiceCreationDate: new Date(Date.UTC(year, 1, 20)),
    description: '',
    invoice: [{ type: 'electricityPrice', amount: 300, price: 5, sum: 0 }],
    generalSum: 0,
    currency: 'UAH',
  })

  const draft = await buildInvoiceDraft({
    companyId: realEstates[0]._id,
    year,
    month,
    ctx: globalAdmin,
  })

  expect(
    draft.invoice.find((line) => line.type === 'electricityPrice')
  ).toMatchObject({ lastAmount: 300 })
})
