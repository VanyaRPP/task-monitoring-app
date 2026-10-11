import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Street from '@modules/models/Street'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildPartiesInvoiceDraft } from './invoicePartiesActions'

setupTestEnvironment()

// domainAdmin runs only domains[0] («domain 0», address street_0), which bills
// company_0; company_1 belongs to domains[1], someone else's.
const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: users.domainAdmin.email },
}
const period = { month: 10, year: 2030 }
const engineering = [{ name: 'Software engineering', quantity: 168, price: 6 }]

const counts = async () => ({
  domains: await Domain.countDocuments(),
  companies: await RealEstate.countDocuments(),
  streets: await Street.countDocuments(),
  payments: await Payment.countDocuments(),
})

describe('buildPartiesInvoiceDraft', () => {
  it('drafts a new provider and company by name, writing nothing', async () => {
    const before = await counts()

    const result = await buildPartiesInvoiceDraft({
      domainName: 'Олег',
      companyName: 'Гугл про',
      companyEmail: 'Billing@Google.pro',
      currency: 'USD',
      lines: engineering,
      ...period,
      ctx: domainAdmin,
    })

    expect(await counts()).toEqual(before)
    expect(result.draft).toMatchObject({
      type: 'debit',
      domain: 'new::Олег',
      newDomainTemplateId: '',
      company: 'new::Гугл про',
      companyEmail: 'billing@google.pro',
      monthService: null,
      period: { year: 2030, month: 10 },
      currency: 'USD',
      generalSum: 1008,
      invoice: [
        {
          type: 'custom',
          name: 'Software engineering',
          amount: 168,
          price: 6,
          sum: 1008,
          saveToDomain: true,
        },
      ],
    })
    expect(result.created).toEqual({
      domain: 'Олег',
      company: 'Гугл про',
      street: null,
    })
  })

  it("takes the user's own provider by name instead of a new one", async () => {
    const result = await buildPartiesInvoiceDraft({
      domainName: 'DOMAIN 0',
      companyName: 'Гугл про',
      lines: engineering,
      ...period,
      ctx: domainAdmin,
    })

    expect(result.draft.domain).toBe(domains[0]._id)
    expect(result.draft).not.toHaveProperty('newDomainTemplateId')
    expect(result.created.domain).toBeNull()
  })

  it("does not take someone else's provider of that name", async () => {
    const result = await buildPartiesInvoiceDraft({
      domainName: 'domain 1',
      companyName: 'Гугл про',
      lines: engineering,
      ...period,
      ctx: domainAdmin,
    })

    expect(result.draft.domain).toBe('new::domain 1')
  })

  it('bills an existing company by name the usual way, with the named lines', async () => {
    const result = await buildPartiesInvoiceDraft({
      companyName: 'Company_0',
      lines: [{ name: 'Консультація', quantity: 2, price: 500 }],
      ...period,
      ctx: domainAdmin,
    })

    expect(result.draft.company).toBe(realEstates[0]._id)
    expect(result.draft.domain).toBe(domains[0]._id)
    expect(result.created).toEqual({
      domain: null,
      company: null,
      street: null,
    })
    expect((result.draft as any).extraLines).toEqual([
      expect.objectContaining({
        name: 'Консультація',
        amount: 2,
        price: 500,
        sum: 1000,
      }),
    ])
  })

  it("creates a company rather than reach someone else's of that name", async () => {
    const result = await buildPartiesInvoiceDraft({
      companyName: 'company_1',
      lines: engineering,
      ...period,
      ctx: domainAdmin,
    })

    // The user's only provider bills it; company_1 itself stays out of reach.
    expect(result.draft.domain).toBe(domains[0]._id)
    expect(result.draft.company).toBe('new::company_1')
  })

  it("picks the provider's address by words, or a new one with its city", async () => {
    const known = await buildPartiesInvoiceDraft({
      companyName: 'Гугл про',
      street: 'street 0',
      lines: engineering,
      ...period,
      ctx: domainAdmin,
    })
    expect((known.draft as any).street).toBe(String(domains[0].streets[0]))

    const created = await buildPartiesInvoiceDraft({
      companyName: 'Гугл про',
      street: 'вул. Шевченка, 5',
      city: 'Львів',
      lines: engineering,
      ...period,
      ctx: domainAdmin,
    })
    expect((created.draft as any).street).toBe('new::вул. Шевченка, 5::Львів')
    expect(created.created.street).toBe('вул. Шевченка, 5 (м. Львів)')
  })

  it('asks for the city of a new address', async () => {
    await expect(
      buildPartiesInvoiceDraft({
        companyName: 'Гугл про',
        street: 'вул. Шевченка, 5',
        lines: engineering,
        ...period,
        ctx: domainAdmin,
      })
    ).rejects.toThrow('city is required')
  })

  it('asks for the provider when the user has several', async () => {
    await Domain.updateOne(
      { _id: domains[1]._id },
      { adminEmails: [users.domainAdmin.email] }
    )

    await expect(
      buildPartiesInvoiceDraft({
        companyName: 'Гугл про',
        lines: engineering,
        ...period,
        ctx: domainAdmin,
      })
    ).rejects.toThrow('provider is required')
  })

  it('leaves out a malformed company email', async () => {
    const result = await buildPartiesInvoiceDraft({
      domainName: 'Олег',
      companyName: 'Гугл про',
      companyEmail: 'google pro',
      lines: engineering,
      ...period,
      ctx: domainAdmin,
    })

    expect(result.draft).not.toHaveProperty('companyEmail')
    expect(result.invalidEmail).toBe(true)
  })

  it('refuses a provider id the user does not run', async () => {
    await expect(
      buildPartiesInvoiceDraft({
        domainId: domains[1]._id,
        companyName: 'Гугл про',
        lines: engineering,
        ...period,
        ctx: domainAdmin,
      })
    ).rejects.toThrow('domain not accessible')
  })
})
