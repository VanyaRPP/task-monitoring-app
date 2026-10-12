import mongoose from 'mongoose'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, streets } from '@utils/testData'
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
