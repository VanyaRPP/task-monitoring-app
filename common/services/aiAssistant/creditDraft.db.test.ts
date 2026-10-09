import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import Payment from '@modules/models/Payment'
import Service from '@modules/models/Service'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildCreditDraft } from './invoiceActions'

setupTestEnvironment()

// domainAdmin runs domains[0]; realEstates[0] is a company there,
// realEstates[1] lives in domains[1].
const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: users.domainAdmin.email },
}

const ownCompany = realEstates[0]._id
const foreignCompany = realEstates[1]._id

describe('buildCreditDraft', () => {
  it('drafts a received payment and writes nothing', async () => {
    const payments = await Payment.countDocuments()
    const services = await Service.countDocuments()

    const draft = await buildCreditDraft({
      companyId: ownCompany,
      amount: 3500,
      month: 3,
      year: 2030,
      date: '2030-04-02',
      ctx: domainAdmin,
    })

    expect(await Payment.countDocuments()).toBe(payments)
    expect(await Service.countDocuments()).toBe(services)
    expect(draft).toMatchObject({
      type: 'credit',
      company: ownCompany,
      domain: domains[0]._id,
      generalSum: 3500,
      invoice: [],
      invoiceCreationDate: '2030-04-02',
      // No Service for March 2030 yet: the form creates it on save.
      monthService: null,
      period: { year: 2030, month: 3 },
      description: 'Оплата за 03.2030',
    })
    expect(draft.reciever.companyName).toBe(realEstates[0].companyName)
  })

  it('stores a minus as a positive amount and keeps a named purpose', async () => {
    const draft = await buildCreditDraft({
      companyId: ownCompany,
      amount: -1200.5,
      month: 3,
      year: 2030,
      description: 'Квартплата березень',
      ctx: domainAdmin,
    })

    expect(draft.generalSum).toBe(1200.5)
    expect(draft.description).toBe('Квартплата березень')
  })

  it('ignores a malformed date and uses today', async () => {
    const draft = await buildCreditDraft({
      companyId: ownCompany,
      amount: 100,
      month: 3,
      year: 2030,
      date: 'вчора',
      ctx: domainAdmin,
    })

    expect(draft.invoiceCreationDate).toBeInstanceOf(Date)
  })

  it('refuses a company outside the user domains', async () => {
    await expect(
      buildCreditDraft({
        companyId: foreignCompany,
        amount: 100,
        month: 3,
        year: 2030,
        ctx: domainAdmin,
      })
    ).rejects.toThrow('company not accessible')
  })

  it.each([[0], [Number.NaN]])('rejects an amount of %p', async (amount) => {
    await expect(
      buildCreditDraft({
        companyId: ownCompany,
        amount,
        month: 3,
        year: 2030,
        ctx: domainAdmin,
      })
    ).rejects.toThrow('amount must be a positive number')
  })
})
