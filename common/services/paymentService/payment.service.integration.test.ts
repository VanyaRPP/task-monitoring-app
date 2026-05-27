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
}: {
  domain: unknown
  street: unknown
  company: unknown
  invoiceNumber: number
  date?: Date
}) {
  return Payment.create({
    invoiceNumber,
    type: 'debit',
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
