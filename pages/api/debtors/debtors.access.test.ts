import { expect } from '@jest/globals'
import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import handler from './index'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/debt-calculation/debtors-inflation', () => ({
  calculateDebtorsInflation: jest.fn().mockResolvedValue({}),
}))

setupTestEnvironment()

// Fixture ownership (utils/testData):
//   company_0 -> domain 0, admin: user
//   company_1 -> domain 1, admin: user
//   company_2 -> domain 2, admin: domainAdmin
//   company_5 -> domain 0, admin: domainAdmin
//   domain 0 is administered by domainAdmin; domains 1 and 2 by nobody.
const [company0, company1, company2, , , company5] = realEstates
const [domain0, domain1, domain2] = domains

const allDomainIds = [domain0._id, domain1._id, domain2._id]

let invoiceNumber = 1
const payment = (
  company: { _id: string; domain: string },
  type: 'debit' | 'credit',
  generalSum: number
) => ({
  invoiceNumber: invoiceNumber++,
  type,
  company: company._id,
  domain: company.domain,
  monthService: 'month-1',
  generalSum,
})

const seedDebts = () =>
  Payment.insertMany([
    payment(company0, 'debit', 1000),
    payment(company0, 'credit', 300),
    payment(company1, 'debit', 200),
    payment(company2, 'debit', 500),
    payment(company5, 'debit', 400),
  ])

function createMockRes() {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  return res
}

async function getDebtors(
  domainIds: string[] | string,
  extraQuery: Record<string, string> = {}
) {
  const req = { method: 'GET', query: { domainIds, ...extraQuery } } as any
  const res = createMockRes()
  await handler(req, res)
  const body = res.json.mock.lastCall[0]
  return {
    status: res.status.mock.lastCall[0],
    body,
    debts: Object.fromEntries(
      (body.companies ?? []).map((c: any) => [c.companyName, c.totalDebt])
    ),
  }
}

describe('GET /api/debtors – access scope', () => {
  beforeEach(async () => {
    await Payment.deleteMany({})
  })

  describe('as User', () => {
    it('returns the debt of their own companies', async () => {
      await seedDebts()
      await mockLoginAs(users.user)

      const { status, debts } = await getDebtors(allDomainIds)

      expect(status).toBe(200)
      expect(debts).toEqual({ company_0: 700, company_1: 200 })
    })

    it('does not return a foreign company even when its domain is requested', async () => {
      await seedDebts()
      await mockLoginAs(users.user)

      const { status, debts } = await getDebtors([domain2._id])

      expect(status).toBe(200)
      expect(debts).toEqual({})
    })

    it('only returns own companies from a domain shared with other companies', async () => {
      await seedDebts()
      await mockLoginAs(users.user)

      // domain 0 holds company_0 (theirs) and company_5 (not theirs)
      const { debts } = await getDebtors(domain0._id)

      expect(debts).toEqual({ company_0: 700 })
    })

    it('ignores role hints sent by the client', async () => {
      await seedDebts()
      await mockLoginAs(users.user)

      const { debts } = await getDebtors(allDomainIds, {
        isGlobalAdmin: 'true',
        role: 'GlobalAdmin',
      })

      expect(debts).toEqual({ company_0: 700, company_1: 200 })
    })

    it('returns nothing for a user without companies', async () => {
      await seedDebts()
      await mockLoginAs(users.user2)

      const { status, debts } = await getDebtors(allDomainIds)

      expect(status).toBe(200)
      expect(debts).toEqual({})
    })

    it('returns nothing for a user without roles', async () => {
      await seedDebts()
      await mockLoginAs(users.noRoleUser)

      const { status, debts } = await getDebtors(allDomainIds)

      expect(status).toBe(200)
      expect(debts).toEqual({})
    })
  })

  describe('as DomainAdmin', () => {
    it('returns companies of owned domains plus companies they administer', async () => {
      await seedDebts()
      await mockLoginAs(users.domainAdmin)

      const { status, debts } = await getDebtors(allDomainIds)

      expect(status).toBe(200)
      // company_1 sits in domain 1, which domainAdmin does not administer
      expect(debts).toEqual({ company_0: 700, company_2: 500, company_5: 400 })
    })

    it('gets nothing from a foreign domain', async () => {
      await seedDebts()
      await mockLoginAs(users.domainAdmin)

      const { debts } = await getDebtors([domain1._id])

      expect(debts).toEqual({})
    })

    it('loses access to the domain companies once removed from the domain admins', async () => {
      await seedDebts()
      await Domain.updateOne({ _id: domain0._id }, { adminEmails: [] })
      await mockLoginAs(users.domainAdmin)

      const { debts } = await getDebtors(allDomainIds)

      // demoted to User: only companies listing them in adminEmails remain
      expect(debts).toEqual({ company_2: 500, company_5: 400 })
    })
  })

  describe('as GlobalAdmin', () => {
    it('returns every company with a debt in the requested domains', async () => {
      await seedDebts()
      await mockLoginAs(users.globalAdmin)

      const { status, debts } = await getDebtors(allDomainIds)

      expect(status).toBe(200)
      expect(debts).toEqual({
        company_0: 700,
        company_1: 200,
        company_2: 500,
        company_5: 400,
      })
    })
  })

  describe('zero or missing debt', () => {
    it('omits a company whose debit and credit cancel out', async () => {
      await Payment.insertMany([
        payment(company0, 'debit', 300),
        payment(company0, 'credit', 300),
        payment(company1, 'debit', 150),
      ])
      await mockLoginAs(users.user)

      const { debts } = await getDebtors(allDomainIds)

      expect(debts).toEqual({ company_1: 150 })
    })

    it('returns an empty list when there are no payments', async () => {
      await mockLoginAs(users.user)

      const { status, body } = await getDebtors(allDomainIds)

      expect(status).toBe(200)
      expect(body).toEqual({ success: true, companies: [] })
    })
  })

  it('rejects a request without valid domain ids', async () => {
    await mockLoginAs(users.user)

    const { status } = await getDebtors(['not-an-id'])

    expect(status).toBe(400)
  })
})
