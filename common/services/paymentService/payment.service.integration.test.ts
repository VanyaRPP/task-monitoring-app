/**
 * @jest-environment node
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'

import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import { getPayments } from './payment.service'

jest.mock('@common/services/profitService/profit.service', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}))

jest.mock('@utils/email/sendInvoiceEmail', () => ({
  sendInvoiceEmail: jest.fn(),
}))

jest.setTimeout(120000)

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
}, 120000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

afterEach(async () => {
  await Promise.all([
    Payment.deleteMany({}),
    RealEstate.deleteMany({}),
    Domain.deleteMany({}),
    Street.deleteMany({}),
  ])
})

async function seedScope({
  companyAdminEmail,
  domainAdminEmail = companyAdminEmail,
}: {
  companyAdminEmail: string
  domainAdminEmail?: string
}) {
  const street = await Street.create({
    address: 'вул. Тестова, 1',
    city: 'Київ',
  })
  const domain = await Domain.create({
    name: 'Test domain',
    adminEmails: [domainAdminEmail],
    streets: [street._id],
    description: 'd',
  })
  const company = await RealEstate.create({
    domain: domain._id,
    street: street._id,
    companyName: 'Test company',
    description: 'c',
    adminEmails: [companyAdminEmail],
  })
  return { street, domain, company }
}

async function seedPayment({
  domain,
  street,
  company,
  invoiceNumber,
  date = new Date('2026-03-01'),
  type = 'debit',
}: {
  domain: unknown
  street: unknown
  company: unknown
  invoiceNumber: number
  date?: Date
  type?: 'debit' | 'credit'
}) {
  return Payment.create({
    invoiceNumber,
    type,
    invoiceCreationDate: date,
    domain,
    street,
    company,
    generalSum: 100,
    invoice: [],
  })
}

describe('getPayments — integration', () => {
  it('global admin: returns all payments without filters', async () => {
    const { domain, street, company } = await seedScope({
      companyAdminEmail: 'owner@test.com',
    })
    await seedPayment({
      domain: domain._id,
      street: street._id,
      company: company._id,
      invoiceNumber: 1,
    })

    const result = await getPayments(
      { limit: '10', skip: '0' },
      {
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        user: { email: 'globalAdmin@test.com' },
      }
    )

    expect(result.success).toBe(true)
    expect(result.total).toBe(1)
    expect(result.data).toHaveLength(1)
  })

  it('domain admin with single-domain scope (regression for $in parse error)', async () => {
    const adminEmail = 'domain-admin@test.com'
    const { domain, street, company } = await seedScope({
      companyAdminEmail: adminEmail,
      domainAdminEmail: adminEmail,
    })
    await seedPayment({
      domain: domain._id,
      street: street._id,
      company: company._id,
      invoiceNumber: 1,
    })

    await expect(
      getPayments(
        { limit: '10', skip: '0' },
        {
          isGlobalAdmin: false,
          isDomainAdmin: true,
          isUser: false,
          user: { email: adminEmail },
        }
      )
    ).resolves.toMatchObject({ success: true, total: 1 })
  })

  it('user with payments referencing deleted companies does not crash', async () => {
    const userEmail = 'user@test.com'
    const { domain, street, company } = await seedScope({
      companyAdminEmail: userEmail,
    })
    await seedPayment({
      domain: domain._id,
      street: street._id,
      company: company._id,
      invoiceNumber: 1,
    })
    // payment referencing a company that no longer exists
    await seedPayment({
      domain: domain._id,
      street: street._id,
      company: new Types.ObjectId(),
      invoiceNumber: 2,
    })

    const result = await getPayments(
      { limit: '10', skip: '0' },
      {
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
        user: { email: userEmail },
      }
    )

    expect(result.success).toBe(true)
    expect(result.total).toBe(1)
  })
})

const asGlobalAdmin = {
  isGlobalAdmin: true,
  isDomainAdmin: false,
  isUser: false,
  user: { email: 'globalAdmin@test.com' },
}

describe('getPayments — credit above debit within one displayed day', () => {
  const listOrder = async (query = {}) => {
    const result = await getPayments(
      { limit: '50', skip: '0', ...query },
      asGlobalAdmin
    )
    return result.data.map((payment: any) => ({
      invoiceNumber: payment.invoiceNumber,
      type: payment.type,
    }))
  }

  const seedScopedPayments = async () => {
    const { domain, street, company } = await seedScope({
      companyAdminEmail: 'owner@test.com',
    })
    return { domain: domain._id, street: street._id, company: company._id }
  }

  it('puts the credit first even though the debit was entered later that day', async () => {
    const scope = await seedScopedPayments()

    await seedPayment({
      ...scope,
      invoiceNumber: 1,
      type: 'credit',
      date: new Date('2026-07-08T06:00:00Z'), // 09:00 Kyiv
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 2,
      type: 'debit',
      date: new Date('2026-07-08T11:00:00Z'), // 14:00 Kyiv
    })

    expect(await listOrder()).toEqual([
      { invoiceNumber: 1, type: 'credit' },
      { invoiceNumber: 2, type: 'debit' },
    ])
  })

  it('applies the same order to the newest date as to every older one', async () => {
    const scope = await seedScopedPayments()

    // Three days, each with the debit entered later in the day than the credit.
    await seedPayment({
      ...scope,
      invoiceNumber: 10,
      type: 'credit',
      date: new Date('2026-07-06T06:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 11,
      type: 'debit',
      date: new Date('2026-07-06T15:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 20,
      type: 'credit',
      date: new Date('2026-07-07T06:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 21,
      type: 'debit',
      date: new Date('2026-07-07T15:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 30,
      type: 'credit',
      date: new Date('2026-07-08T06:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 31,
      type: 'debit',
      date: new Date('2026-07-08T15:00:00Z'),
    })

    expect((await listOrder()).map((p) => p.invoiceNumber)).toEqual([
      30, 31, 20, 21, 10, 11,
    ])
  })

  it('groups a late-evening payment with the day the table renders, not the UTC day', async () => {
    const scope = await seedScopedPayments()

    await seedPayment({
      ...scope,
      invoiceNumber: 1,
      type: 'debit',
      date: new Date('2026-07-03T09:00:00Z'), // 12:00 Kyiv, 3 липня
    })

    await seedPayment({
      ...scope,
      invoiceNumber: 2,
      type: 'credit',
      date: new Date('2026-07-03T21:30:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 3,
      type: 'debit',
      date: new Date('2026-07-04T09:00:00Z'), // 12:00 Kyiv, 4 липня
    })

    expect((await listOrder()).map((p) => p.invoiceNumber)).toEqual([2, 3, 1])
  })

  it('keeps the order in winter, when Kyiv is UTC+2 rather than UTC+3', async () => {
    const scope = await seedScopedPayments()

    await seedPayment({
      ...scope,
      invoiceNumber: 1,
      type: 'credit',
      date: new Date('2026-01-14T22:30:00Z'), // 00:30 Kyiv, 15 січня
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 2,
      type: 'debit',
      date: new Date('2026-01-15T12:00:00Z'), // 14:00 Kyiv, 15 січня
    })

    expect(await listOrder()).toEqual([
      { invoiceNumber: 1, type: 'credit' },
      { invoiceNumber: 2, type: 'debit' },
    ])
  })

  it('keeps a mark-paid credit (invoice instant + 1ms) above its invoice', async () => {
    const scope = await seedScopedPayments()

    const invoiceDate = new Date('2026-07-08T11:00:00Z')
    await seedPayment({
      ...scope,
      invoiceNumber: 1,
      type: 'debit',
      date: invoiceDate,
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 2,
      type: 'credit',
      date: new Date(invoiceDate.getTime() + 1),
    })

    expect(await listOrder()).toEqual([
      { invoiceNumber: 2, type: 'credit' },
      { invoiceNumber: 1, type: 'debit' },
    ])
  })

  it('orders newest first within a day once the type is equal', async () => {
    const scope = await seedScopedPayments()

    await seedPayment({
      ...scope,
      invoiceNumber: 1,
      type: 'debit',
      date: new Date('2026-07-08T06:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 2,
      type: 'debit',
      date: new Date('2026-07-08T15:00:00Z'),
    })

    expect((await listOrder()).map((p) => p.invoiceNumber)).toEqual([2, 1])
  })

  it('holds the order across pages', async () => {
    const scope = await seedScopedPayments()

    await seedPayment({
      ...scope,
      invoiceNumber: 1,
      type: 'credit',
      date: new Date('2026-07-08T06:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 2,
      type: 'debit',
      date: new Date('2026-07-08T15:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 3,
      type: 'credit',
      date: new Date('2026-07-07T06:00:00Z'),
    })
    await seedPayment({
      ...scope,
      invoiceNumber: 4,
      type: 'debit',
      date: new Date('2026-07-07T15:00:00Z'),
    })

    const page1 = await getPayments({ limit: '2', skip: '0' }, asGlobalAdmin)
    const page2 = await getPayments({ limit: '2', skip: '2' }, asGlobalAdmin)

    expect(page1.data.map((p: any) => p.invoiceNumber)).toEqual([1, 2])
    expect(page2.data.map((p: any) => p.invoiceNumber)).toEqual([3, 4])
    expect(page1.total).toBe(4)
  })

  it('still applies schema defaults that a raw aggregation would drop', async () => {
    const scope = await seedScopedPayments()

    // Written straight through the driver, the way pre-status documents were
    // stored: no `status`, `currency` or `template` field at all.
    await Payment.collection.insertOne({
      ...scope,
      invoiceNumber: 1,
      type: 'debit',
      invoiceCreationDate: new Date('2026-07-08T11:00:00Z'),
      generalSum: 100,
      invoice: [],
    })

    const { data } = await getPayments(
      { limit: '10', skip: '0' },
      asGlobalAdmin
    )
    const [payment] = data as any[]

    expect(payment.status).toBe('draft')
    expect(payment.currency).toBe('UAH')
    expect(payment.template).toBe('classic')
  })
})

describe('getPayments — scoped filters reach the aggregation stages', () => {
  it('returns a domain admin their payments and the matching totals', async () => {
    const adminEmail = 'domain-admin@test.com'
    const { domain, street, company } = await seedScope({
      companyAdminEmail: adminEmail,
      domainAdminEmail: adminEmail,
    })
    const scope = {
      domain: domain._id,
      street: street._id,
      company: company._id,
    }

    await seedPayment({ ...scope, invoiceNumber: 1, type: 'debit' })
    await seedPayment({ ...scope, invoiceNumber: 2, type: 'credit' })

    const result = await getPayments(
      { limit: '10', skip: '0' },
      {
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        user: { email: adminEmail },
      }
    )

    expect(result.data).toHaveLength(2)
    expect(result.totalPayments).toMatchObject({ debit: 100, credit: 100 })
  })

  it('scopes an ordinary user the same way', async () => {
    const userEmail = 'user@test.com'
    const { domain, street, company } = await seedScope({
      companyAdminEmail: userEmail,
    })
    const scope = {
      domain: domain._id,
      street: street._id,
      company: company._id,
    }

    await seedPayment({ ...scope, invoiceNumber: 1, type: 'debit' })

    const result = await getPayments(
      { limit: '10', skip: '0' },
      {
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
        user: { email: userEmail },
      }
    )

    expect(result.data).toHaveLength(1)
    expect(result.totalPayments).toMatchObject({ debit: 100 })
  })
})
