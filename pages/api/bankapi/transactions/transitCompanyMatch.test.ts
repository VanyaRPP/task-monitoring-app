/**
 * Transit-account payments ("Транз.рахунок…") carry the bank's details, not the
 * payer's, so the company has to come from the payment purpose (OSND). These
 * run the real checkTransaction against in-memory Mongo with rows shaped like
 * real PrivatBank transit transactions (names and accounts anonymised).
 */
import mongoose from 'mongoose'
import Payment from '@modules/models/Payment'
import { Operations } from '@utils/constants'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { checkTransaction } from './index'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock(
  'pages/api/bankapi/transactions/utils/getTransactions/index',
  () => ({ getTransactionsForDateInterval: jest.fn() }),
  { virtual: true }
)

setupTestEnvironment()

const { ObjectId } = mongoose.Types

const domainId = new ObjectId()
const otherDomainId = new ObjectId()
const companyId = new ObjectId()
const otherCompanyId = new ObjectId()

const PAYER = 'Тестенко Петро Іванович'

let seq = 0
const transitRow = (osnd: string) => {
  seq += 1
  const ref = `REF${String(seq).padStart(11, '0')}`
  return {
    AUT_MY_CRF: '1111111111',
    AUT_MY_MFO: '305299',
    AUT_MY_ACC: 'UA000000000000000000000000001',
    AUT_MY_NAM: 'Тестова О. О. ФОП',
    AUT_CNTR_CRF: '14360570',
    AUT_CNTR_MFO: '305299',
    AUT_CNTR_ACC: 'UA293052990000029023866100110',
    AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
    CCY: 'UAH',
    OSND: osnd,
    SUM: '1000.00',
    REF: ref,
    REFN: 'P',
    DAT_OD: '30.10.2026',
    DATE_TIME_DAT_OD_TIM_P: '30.10.2026 17:27:00',
    TECHNICAL_TRANSACTION_ID: `${ref}P30102026172700C`,
    TRANTYPE: 'C',
  }
}

const invoiceRow = (invoice: number, date: string, payer = PAYER) =>
  transitRow(
    `Оплата за послуги згідно рахунку ${invoice} від ${date}, ${payer}`
  )

const insertInvoice = (
  invoiceNumber: number,
  domain = domainId,
  company = companyId
) =>
  Payment.collection.insertOne({
    invoiceNumber,
    type: Operations.Debit,
    domain,
    company,
    invoiceCreationDate: new Date('2026-07-01'),
  })

const insertSentPayment = (
  transaction: Record<string, unknown>,
  domain = domainId,
  company = companyId
) =>
  Payment.collection.insertOne({
    invoiceNumber: 90000 + seq,
    type: Operations.Credit,
    domain,
    company,
    invoiceCreationDate: new Date('2026-10-30'),
    transaction,
  })

const check = (transaction: Record<string, unknown>, domain = domainId) =>
  checkTransaction({ transaction, domainId: String(domain), companies: [] })

describe('checkTransaction — transit account payments', () => {
  beforeEach(async () => {
    await Payment.deleteMany({})
  })

  it('finds the company of the invoice the payer quoted, before anything was sent', async () => {
    await insertInvoice(1301)

    const result = await check(invoiceRow(1301, '13-07-2026'))

    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: String(companyId),
    })
  })

  it('reads the invoice number in other purpose formats', async () => {
    await insertInvoice(939)
    await insertInvoice(1208)
    await insertInvoice(1302)

    for (const osnd of [
      'Сплата за послуги згідно рахунку № 939 від 08.01.2026, Тест Марія Іванівна',
      'оплата згідно рахунку #1208',
      'РАХУНОК № 1302',
    ]) {
      const result = await check(transitRow(osnd))
      expect(result.previousCompanyId).toBe(String(companyId))
    }
  })

  it('does not take an invoice of the same number from another domain', async () => {
    await insertInvoice(1301, otherDomainId, otherCompanyId)

    const result = await check(invoiceRow(1301, '13-07-2026'))

    expect(result.previousCompanyId).toBeNull()
  })

  it('after one invoice was sent, the same payer’s next invoices get the company', async () => {
    // The invoices themselves are not in the system (e.g. issued elsewhere),
    // so only the earlier payment from this payer can link them.
    const sent = invoiceRow(1132, '14-05-2026')
    await insertSentPayment(sent)

    expect(await check(sent)).toEqual({
      isMatchingPayment: true,
      previousCompanyId: String(companyId),
    })
    for (const next of [
      invoiceRow(1207, '15-06-2026'),
      invoiceRow(1301, '13-07-2026'),
    ]) {
      expect(await check(next)).toEqual({
        isMatchingPayment: false,
        previousCompanyId: String(companyId),
      })
    }
  })

  it('matches the payer name regardless of case and spacing', async () => {
    await insertSentPayment(invoiceRow(1132, '14-05-2026'))

    const result = await check(
      invoiceRow(1207, '15-06-2026', 'ТЕСТЕНКО  Петро   ІВАНОВИЧ')
    )

    expect(result.previousCompanyId).toBe(String(companyId))
  })

  it('does not match a different payer, or a payer whose name only ends the same', async () => {
    await insertSentPayment(invoiceRow(1132, '14-05-2026'))

    for (const payer of ['Тестенко Ольга Іванівна', 'Петро Іванович']) {
      const result = await check(invoiceRow(1207, '15-06-2026', payer))
      expect(result.previousCompanyId).toBeNull()
    }
  })

  it('ignores payments from another domain, by purpose and by payer', async () => {
    const sent = invoiceRow(1132, '14-05-2026')
    await insertSentPayment(
      { ...sent, TECHNICAL_TRANSACTION_ID: 'other-id' },
      otherDomainId,
      otherCompanyId
    )

    const samePurpose = { ...sent, TECHNICAL_TRANSACTION_ID: 'new-id' }
    expect((await check(samePurpose)).previousCompanyId).toBeNull()
    expect(
      (await check(invoiceRow(1207, '15-06-2026'))).previousCompanyId
    ).toBeNull()
  })

  it('a transaction saved in another domain is not «sent» here', async () => {
    const tx = invoiceRow(1132, '14-05-2026')
    await insertSentPayment(tx, otherDomainId, otherCompanyId)

    expect(await check(tx)).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
    expect(await check(tx, otherDomainId)).toEqual({
      isMatchingPayment: true,
      previousCompanyId: String(otherCompanyId),
    })
  })

  it('prefers the invoice the payer quoted over their earlier payments', async () => {
    // The same person pays for two companies; the invoice decides.
    await insertSentPayment(
      invoiceRow(1132, '14-05-2026'),
      domainId,
      otherCompanyId
    )
    await insertInvoice(1207)

    const result = await check(invoiceRow(1207, '15-06-2026'))

    expect(result.previousCompanyId).toBe(String(companyId))
  })

  it('does not treat a non-name tail of the purpose as a payer', async () => {
    await insertSentPayment(
      transitRow('Оплата за послуги, без ПДВ, 1000.00 грн')
    )

    const result = await check(
      transitRow('Оплата за оренду, без ПДВ, 1000.00 грн')
    )

    expect(result.previousCompanyId).toBeNull()
  })
})

describe('checkTransaction — a transaction saved on more than one payment', () => {
  beforeEach(async () => {
    await Payment.deleteMany({})
    // setupTestEnvironment drops the database after every test, indexes
    // included: rebuild the schema's ones so the lookup can take the domain
    // index, as it does in production.
    await Payment.createIndexes()
  })

  const insertSentOn = (
    company: mongoose.Types.ObjectId,
    invoiceCreationDate: Date,
    transaction: Record<string, unknown>
  ) =>
    Payment.collection.insertOne({
      invoiceNumber: 90000 + seq,
      type: Operations.Credit,
      domain: domainId,
      company,
      invoiceCreationDate,
      transaction,
    })

  it('names the company of the payment saved first, as the collection scan did', async () => {
    const names = (await Payment.collection.indexes()).map(({ name }) => name)
    expect(names).toContain('domain_1_invoiceCreationDate_-1')

    const tx = invoiceRow(1500, '01-10-2026')
    // Saved first, but with the older invoice date: the domain index alone
    // would hand back the other one first.
    await insertSentOn(companyId, new Date('2026-10-01'), tx)
    await insertSentOn(otherCompanyId, new Date('2026-10-30'), tx)

    const naturalOrder = await Payment.find({
      domain: domainId,
      'transaction.TECHNICAL_TRANSACTION_ID': tx.TECHNICAL_TRANSACTION_ID,
    })
      .sort({ $natural: 1 })
      .lean()
    expect(String(naturalOrder[0].company)).toBe(String(companyId))

    expect(await check(tx)).toEqual({
      isMatchingPayment: true,
      previousCompanyId: String(companyId),
    })
  })
})
