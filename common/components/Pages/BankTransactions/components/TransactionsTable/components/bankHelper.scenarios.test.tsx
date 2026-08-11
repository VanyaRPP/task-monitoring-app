import { matchCompany } from './bankHelper'
import { ITransaction } from './transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'

/**
 * End-to-end matchCompany scenarios modelled on a real bank feed (anonymized).
 * They lock in that AUT_CNTR_CRF matching:
 *  - fixes the same payer paying from different accounts, and
 *  - does NOT wrongly auto-select the owner's own company on self-transactions
 *    (returns, own card top-ups), bank commissions or tax payments.
 */
const OWNER_CRF = '9999999999'

const companies: IRealestate[] = [
  // Owner's own company — intentionally has rnokpp === OWNER_CRF to prove the
  // self-transaction guard, and an account to prove self-debits don't match it.
  {
    _id: 'owner-id',
    companyName: 'DOMAIN OWNER',
    rnokpp: OWNER_CRF,
    account: 'UA000000000000000000000000010',
  } as IRealestate,
  // Payer who uses several accounts; stored account is an old one.
  {
    _id: 'payer-id',
    companyName: 'ФОП Payer One',
    rnokpp: '1111111111',
    account: 'UA000000000000000000000000003',
  } as IRealestate,
  // Transit payer, identified by RECIPIENT_ULTMT_NCEO.
  {
    _id: 'transit-payer-id',
    companyName: 'Payer Two',
    rnokpp: '2222222222',
  } as IRealestate,
  // Matched by account (account already stored on the company).
  {
    _id: 'account-payer-id',
    companyName: 'Payer Three',
    account: 'UA000000000000000000000000020',
    rnokpp: '3333333333',
  } as IRealestate,
  // Matched only by tax code (no account stored).
  {
    _id: 'taxcode-payer-id',
    companyName: 'ФОП Payer Four',
    rnokpp: '4444444444',
  } as IRealestate,
]

// Minimal helper: every record carries the owner's code, like the real feed.
const tx = (t: Partial<ITransaction>): ITransaction =>
  ({ AUT_MY_CRF: OWNER_CRF, ...t }) as ITransaction

describe('bank feed — matchCompany end to end', () => {
  describe('SHOULD auto-select', () => {
    it('payer, account A (differs from stored) → by tax code', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '1111111111',
            AUT_CNTR_ACC: 'UA000000000000000000000000001',
            AUT_CNTR_NAM: 'ФОП Payer One',
            RECIPIENT_ULTMT_NCEO: '',
          }),
          companies
        )
      ).toEqual({ companyId: 'payer-id', matchedBy: 'rnokpp' })
    })

    it('same payer, account B (card) → by tax code', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '1111111111',
            AUT_CNTR_ACC: 'UA000000000000000000000000002',
            AUT_CNTR_NAM: 'КАРТКОВИЙ - ФОП Payer One',
            RECIPIENT_ULTMT_NCEO: '',
          }),
          companies
        )
      ).toEqual({ companyId: 'payer-id', matchedBy: 'rnokpp' })
    })

    it('transit account → by NCEO tax code', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '5555555555',
            AUT_CNTR_ACC: 'UA000000000000000000000000099',
            AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
            RECIPIENT_ULTMT_NCEO: '2222222222',
            RECIPIENT_ULTMT_NAME: 'Payer Two',
          }),
          companies
        )
      ).toEqual({ companyId: 'transit-payer-id', matchedBy: 'rnokpp' })
    })

    it('account already stored on company → by account', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '3333333333',
            AUT_CNTR_ACC: 'UA000000000000000000000000020',
            AUT_CNTR_NAM: 'Payer Three',
          }),
          companies
        )
      ).toEqual({ companyId: 'account-payer-id', matchedBy: 'account' })
    })

    it('no stored account → by tax code', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '4444444444',
            AUT_CNTR_ACC: 'UA000000000000000000000000021',
            AUT_CNTR_NAM: 'ФОП Payer Four',
          }),
          companies
        )
      ).toEqual({ companyId: 'taxcode-payer-id', matchedBy: 'rnokpp' })
    })

    it('transit payment with server previousCompanyId → by previous', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '5555555555',
            AUT_CNTR_ACC: 'UA000000000000000000000000099',
            AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
            OSND: 'Сплата за послуги згідно рахунку, Payer Five',
            previousCompanyId: 'transit-prev-id',
          }),
          companies
        )
      ).toEqual({ companyId: 'transit-prev-id', matchedBy: 'previous' })
    })
  })

  describe('SHOULD NOT auto-select (guard against false positives)', () => {
    it('owner self — "return of funds" (AUT_CNTR_CRF === AUT_MY_CRF)', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: OWNER_CRF,
            AUT_CNTR_ACC: 'UA000000000000000000000000011',
            AUT_CNTR_NAM: 'DOMAIN OWNER',
            OSND: 'return of funds',
          }),
          companies
        )
      ).toEqual({ companyId: null, matchedBy: null })
    })

    it('owner self — own funds transfer', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: OWNER_CRF,
            AUT_CNTR_ACC: 'UA000000000000000000000000012',
            AUT_CNTR_NAM: 'DOMAIN OWNER',
            OSND: 'own funds transfer',
          }),
          companies
        )
      ).toEqual({ companyId: null, matchedBy: null })
    })

    it('bank commission debit (unknown tax code)', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '5555555555',
            AUT_CNTR_ACC: 'UA000000000000000000000000050',
            AUT_CNTR_NAM: 'ЗА ДЕБЕТУВАННЯ РАХУНКУ(UAH)',
          }),
          companies
        )
      ).toEqual({ companyId: null, matchedBy: null })
    })

    it('treasury tax payment (unknown tax code)', () => {
      expect(
        matchCompany(
          tx({
            AUT_CNTR_CRF: '6666666666',
            AUT_CNTR_ACC: 'UA000000000000000000000000060',
            AUT_CNTR_NAM: 'ГОЛОВНЕ УПРАВЛІННЯ КАЗНАЧЕЙСТВА',
            OSND: 'tax payment',
          }),
          companies
        )
      ).toEqual({ companyId: null, matchedBy: null })
    })
  })
})
