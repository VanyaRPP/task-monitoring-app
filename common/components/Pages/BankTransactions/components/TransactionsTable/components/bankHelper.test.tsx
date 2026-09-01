import {
  matchCompany,
  matchByAccount,
  matchByRnokpp,
  matchByPrevious,
  matchByName,
  getResolvedDescription,
  isSelfTransaction,
  normalizeCounterpartyName,
  buildCounterpartyNameRegexSource,
} from './bankHelper'
import { ITransaction } from './transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'

const mockCompanies: IRealestate[] = [
  { _id: '1', companyName: 'Sport Space', account: 'UA123' } as IRealestate,
  { _id: '2', companyName: 'Nude', account: 'UA456' } as IRealestate,
]

const companies: IRealestate[] = [
  {
    _id: 'sport-space-id',
    companyName: 'Sport Space',
    account: undefined,
  } as IRealestate,
  {
    _id: 'vityuk-id',
    companyName: 'Вітюк Дмитро Олександрович',
    account: 'UA293220010000026205305849120',
  } as IRealestate,
  { _id: 'nude-id', companyName: 'Nude', account: undefined } as IRealestate,
  {
    _id: 'olimp-id',
    companyName: 'OlimpDigital',
    account: undefined,
  } as IRealestate,
]

const kincalCompany: IRealestate = {
  _id: 'kincal-id',
  companyName: 'Vocal Kincal',
  account: '',
  rnokpp: '3042507187',
} as IRealestate

describe('matchByAccount', () => {
  it('should return match when account found', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA123',
      AUT_CNTR_NAM: 'Some Company',
    } as ITransaction

    expect(matchByAccount(transaction, mockCompanies)).toEqual({
      companyId: '1',
      matchedBy: 'account',
    })
  })

  it('should return null for transit transaction', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA123',
      AUT_CNTR_NAM: 'Транз.рахунок платежi',
    } as ITransaction

    expect(matchByAccount(transaction, mockCompanies)).toBeNull()
  })

  it('should return null if AUT_CNTR_NAM is undefined (treated as non-transit)', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA123',
      AUT_CNTR_NAM: undefined,
    } as ITransaction

    expect(matchByAccount(transaction, mockCompanies)).toEqual({
      companyId: '1',
      matchedBy: 'account',
    })
  })

  it('should return null if account not found', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA999',
      AUT_CNTR_NAM: 'Some Company',
    } as ITransaction

    expect(matchByAccount(transaction, mockCompanies)).toBeNull()
  })

  it('should return null if AUT_CNTR_ACC is empty', () => {
    const transaction = {
      AUT_CNTR_ACC: '',
      AUT_CNTR_NAM: 'Some Company',
    } as ITransaction

    expect(matchByAccount(transaction, mockCompanies)).toBeNull()
  })

  it('should be case-sensitive', () => {
    const transaction = {
      AUT_CNTR_ACC: 'ua123',
      AUT_CNTR_NAM: 'Some Company',
    } as ITransaction

    expect(matchByAccount(transaction, mockCompanies)).toBeNull()
  })

  it('should return null if account has leading/trailing spaces', () => {
    const transaction = {
      AUT_CNTR_ACC: ' UA123 ',
      AUT_CNTR_NAM: 'Some Company',
    } as ITransaction

    expect(matchByAccount(transaction, mockCompanies)).toBeNull()
  })

  it('should return first match when multiple companies share the same account', () => {
    const duplicates = [
      { _id: '1', companyName: 'First', account: 'UA123' } as IRealestate,
      { _id: '2', companyName: 'Second', account: 'UA123' } as IRealestate,
    ]

    expect(
      matchByAccount({ AUT_CNTR_ACC: 'UA123' } as ITransaction, duplicates)
    ).toEqual({
      companyId: '1',
      matchedBy: 'account',
    })
  })
})

describe('matchByRnokpp', () => {
  it('should return match when RECIPIENT_ULTMT_NCEO matches company rnokpp', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA293052990000029023866100110',
      AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
      RECIPIENT_ULTMT_NCEO: '3042507187',
    } as ITransaction

    expect(matchByRnokpp(transaction, [kincalCompany])).toEqual({
      companyId: 'kincal-id',
      matchedBy: 'rnokpp',
    })
  })

  it('should return null if RECIPIENT_ULTMT_NCEO is absent', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA123',
      AUT_CNTR_NAM: 'Транз.рахунок платежi',
    } as ITransaction

    expect(matchByRnokpp(transaction, [kincalCompany])).toBeNull()
  })

  it('should return null if no company has matching rnokpp', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA123',
      RECIPIENT_ULTMT_NCEO: '9999999999',
    } as ITransaction

    expect(matchByRnokpp(transaction, mockCompanies)).toBeNull()
  })

  it('should match by rnokpp found in company description', () => {
    const companyWithRnokppInDescription: IRealestate = {
      _id: 'kincal-desc-id',
      companyName: 'Vocal Kincal',
      account: '',
      rnokpp: '',
      description:
        'Юлія Кінцал\nм. Житомир\nвул. Кибальчича 4\n3042507187\n+380671511260',
    } as IRealestate

    const transaction = {
      AUT_CNTR_ACC: 'UA293052990000029023866100110',
      AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
      RECIPIENT_ULTMT_NCEO: '3042507187',
    } as ITransaction

    expect(
      matchByRnokpp(transaction, [companyWithRnokppInDescription])
    ).toEqual({
      companyId: 'kincal-desc-id',
      matchedBy: 'rnokpp',
    })
  })

  it('should prioritize rnokpp field over description', () => {
    const byField: IRealestate = {
      _id: 'by-field',
      companyName: 'A',
      account: '',
      rnokpp: '3042507187',
    } as IRealestate
    const byDesc: IRealestate = {
      _id: 'by-desc',
      companyName: 'B',
      account: '',
      rnokpp: '',
      description: '3042507187',
    } as IRealestate

    const transaction = { RECIPIENT_ULTMT_NCEO: '3042507187' } as ITransaction

    expect(matchByRnokpp(transaction, [byField, byDesc])).toEqual({
      companyId: 'by-field',
      matchedBy: 'rnokpp',
    })
  })

  it('should match a non-transit payment by counterparty tax code AUT_CNTR_CRF', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA000000000000000000000000001',
      AUT_CNTR_NAM: 'ФОП Payer One',
      AUT_CNTR_CRF: '1111111111',
      RECIPIENT_ULTMT_NCEO: '',
    } as ITransaction

    expect(matchByRnokpp(transaction, [kincalCompany])).toBeNull()
    expect(
      matchByRnokpp(transaction, [
        { _id: 'payer-id', rnokpp: '1111111111' } as IRealestate,
      ])
    ).toEqual({ companyId: 'payer-id', matchedBy: 'rnokpp' })
  })

  it('should match by AUT_CNTR_CRF found in company description', () => {
    const transaction = {
      AUT_CNTR_NAM: 'ФОП Payer One',
      AUT_CNTR_CRF: '1111111111',
    } as ITransaction

    expect(
      matchByRnokpp(transaction, [
        {
          _id: 'payer-desc',
          rnokpp: '',
          description: 'Payer One\n1111111111\n+380...',
        } as IRealestate,
      ])
    ).toEqual({ companyId: 'payer-desc', matchedBy: 'rnokpp' })
  })

  it('should trim AUT_CNTR_CRF before comparing', () => {
    const transaction = {
      AUT_CNTR_NAM: 'ФОП Payer One',
      AUT_CNTR_CRF: '  1111111111  ',
    } as ITransaction

    expect(
      matchByRnokpp(transaction, [
        { _id: 'payer-id', rnokpp: '1111111111' } as IRealestate,
      ])
    ).toEqual({ companyId: 'payer-id', matchedBy: 'rnokpp' })
  })

  it('should NOT use AUT_CNTR_CRF for transit transactions (bank/transit code lives there)', () => {
    const transaction = {
      AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN',
      AUT_CNTR_CRF: '1111111111',
      RECIPIENT_ULTMT_NCEO: '',
    } as ITransaction

    expect(
      matchByRnokpp(transaction, [
        { _id: 'payer-id', rnokpp: '1111111111' } as IRealestate,
      ])
    ).toBeNull()
  })

  it('should NOT match by AUT_CNTR_CRF for a self-transaction (AUT_CNTR_CRF === AUT_MY_CRF)', () => {
    // The owner pays themselves (return of funds, own card top-up): the
    // counterparty tax code equals the domain owner's own code — must never
    // auto-select the owner's own company.
    const transaction = {
      AUT_MY_CRF: '9999999999',
      AUT_CNTR_CRF: '9999999999',
      AUT_CNTR_NAM: 'DOMAIN OWNER',
      OSND: 'return of funds',
    } as ITransaction

    expect(
      matchByRnokpp(transaction, [
        { _id: 'owner-id', rnokpp: '9999999999' } as IRealestate,
      ])
    ).toBeNull()
  })

  it('should return null when neither NCEO nor AUT_CNTR_CRF is present', () => {
    const transaction = {
      AUT_CNTR_NAM: 'ФОП Payer One',
      AUT_CNTR_CRF: '',
      RECIPIENT_ULTMT_NCEO: '',
    } as ITransaction

    expect(
      matchByRnokpp(transaction, [
        { _id: 'payer-id', rnokpp: '1111111111' } as IRealestate,
      ])
    ).toBeNull()
  })
})

describe('isSelfTransaction', () => {
  it('is true when counterparty tax code equals owner tax code', () => {
    expect(
      isSelfTransaction({
        AUT_MY_CRF: '9999999999',
        AUT_CNTR_CRF: '9999999999',
      } as ITransaction)
    ).toBe(true)
  })

  it('trims both codes before comparing', () => {
    expect(
      isSelfTransaction({
        AUT_MY_CRF: ' 9999999999 ',
        AUT_CNTR_CRF: '9999999999',
      } as ITransaction)
    ).toBe(true)
  })

  it('is false for a different counterparty', () => {
    expect(
      isSelfTransaction({
        AUT_MY_CRF: '9999999999',
        AUT_CNTR_CRF: '1111111111',
      } as ITransaction)
    ).toBe(false)
  })

  it('is false when either code is missing (avoids empty === empty match)', () => {
    expect(
      isSelfTransaction({ AUT_MY_CRF: '9999999999' } as ITransaction)
    ).toBe(false)
    expect(
      isSelfTransaction({ AUT_CNTR_CRF: '9999999999' } as ITransaction)
    ).toBe(false)
    expect(isSelfTransaction({} as ITransaction)).toBe(false)
    expect(isSelfTransaction(null)).toBe(false)
  })
})

describe('normalizeCounterpartyName', () => {
  it('strips ФОП and КАРТКОВИЙ, punctuation and case', () => {
    expect(
      normalizeCounterpartyName('КАРТКОВИЙ - ФОП Петренко Петро Петрович')
    ).toBe('ПЕТРЕНКО ПЕТРО ПЕТРОВИЧ')
    expect(normalizeCounterpartyName('ФОП Петренко Петро Петрович')).toBe(
      'ПЕТРЕНКО ПЕТРО ПЕТРОВИЧ'
    )
  })

  it('returns empty string for empty/invalid input', () => {
    expect(normalizeCounterpartyName('')).toBe('')
    expect(normalizeCounterpartyName(undefined)).toBe('')
    expect(normalizeCounterpartyName(null)).toBe('')
  })
})

describe('buildCounterpartyNameRegexSource', () => {
  it('builds a spacing-tolerant regex from the identifying tokens', () => {
    const src = buildCounterpartyNameRegexSource(
      'КАРТКОВИЙ - ФОП Петренко Петро Петрович'
    )
    expect(src).toBe('ПЕТРЕНКО\\s+ПЕТРО\\s+ПЕТРОВИЧ')
  })

  it('matches all name variants of the same payer (case-insensitive)', () => {
    const src = buildCounterpartyNameRegexSource(
      'КАРТКОВИЙ - ФОП Петренко Петро Петрович'
    )
    const re = new RegExp(src as string, 'i')
    expect(re.test('Петренко Петро Петрович')).toBe(true)
    expect(re.test('ФОП Петренко Петро Петрович')).toBe(true)
    expect(re.test('Іваненко Іван Іванович')).toBe(false)
  })

  it('returns null when there are fewer than two tokens', () => {
    expect(buildCounterpartyNameRegexSource('ФОП Петренко')).toBeNull()
    expect(buildCounterpartyNameRegexSource('')).toBeNull()
    expect(buildCounterpartyNameRegexSource(undefined)).toBeNull()
  })
})

describe('matchByName', () => {
  const payer = {
    _id: 'payer-id',
    companyName: 'Петренко Петро Петрович',
  } as IRealestate

  it('matches by full normalized name across ФОП/КАРТКОВИЙ prefixes', () => {
    expect(
      matchByName(
        { AUT_CNTR_NAM: 'ФОП Петренко Петро Петрович' } as ITransaction,
        [payer]
      )
    ).toEqual({ companyId: 'payer-id', matchedBy: 'name' })

    expect(
      matchByName(
        {
          AUT_CNTR_NAM: 'КАРТКОВИЙ - ФОП Петренко Петро Петрович',
        } as ITransaction,
        [payer]
      )
    ).toEqual({ companyId: 'payer-id', matchedBy: 'name' })
  })

  it('does not match a different name', () => {
    expect(
      matchByName(
        { AUT_CNTR_NAM: 'ФОП Іваненко Іван Іванович' } as ITransaction,
        [payer]
      )
    ).toBeNull()
  })

  it('does not match on a single token (needs surname + name)', () => {
    expect(
      matchByName({ AUT_CNTR_NAM: 'ФОП Петренко' } as ITransaction, [
        { _id: 'x', companyName: 'ФОП Петренко' } as IRealestate,
      ])
    ).toBeNull()
  })

  it('never matches transit transactions', () => {
    expect(
      matchByName(
        { AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN' } as ITransaction,
        [{ _id: 'x', companyName: 'Транз рахунок платежi DN' } as IRealestate]
      )
    ).toBeNull()
  })

  it('never matches self-transactions (initials vs full name also differ)', () => {
    expect(
      matchByName(
        {
          AUT_MY_CRF: '2479002623',
          AUT_CNTR_CRF: '2479002623',
          AUT_CNTR_NAM: 'ЄРШОВА ЛЮДМИЛА МИХАЙЛІВНА',
        } as ITransaction,
        [
          {
            _id: 'owner',
            companyName: 'ЄРШОВА ЛЮДМИЛА МИХАЙЛІВНА',
          } as IRealestate,
        ]
      )
    ).toBeNull()
  })
})

describe('matchByPrevious', () => {
  it('should return match when previousCompanyId is present', () => {
    expect(
      matchByPrevious({ previousCompanyId: 'some-company-id' } as ITransaction)
    ).toEqual({
      companyId: 'some-company-id',
      matchedBy: 'previous',
    })
  })

  it('should return null when previousCompanyId is absent', () => {
    expect(
      matchByPrevious({ previousCompanyId: undefined } as ITransaction)
    ).toBeNull()
  })
})

describe('matchCompany', () => {
  it('should prioritize account over rnokpp', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA123',
      AUT_CNTR_NAM: 'Some Company',
      RECIPIENT_ULTMT_NCEO: '3042507187',
    } as ITransaction

    expect(
      matchCompany(transaction, [
        {
          _id: 'acc-id',
          companyName: 'Sport Space',
          account: 'UA123',
          rnokpp: '3042507187',
        } as IRealestate,
        kincalCompany,
      ])
    ).toEqual({ companyId: 'acc-id', matchedBy: 'account' })
  })

  it('should prioritize account over previousCompanyId', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA123',
      AUT_CNTR_NAM: 'Some Company',
      previousCompanyId: '2',
    } as ITransaction

    expect(matchCompany(transaction, mockCompanies)).toEqual({
      companyId: '1',
      matchedBy: 'account',
    })
  })

  it('should prioritize rnokpp over previousCompanyId for transit', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA293052990000029023866100110',
      AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
      RECIPIENT_ULTMT_NCEO: '3042507187',
      previousCompanyId: 'sport-space-id',
    } as ITransaction

    expect(matchCompany(transaction, [...companies, kincalCompany])).toEqual({
      companyId: 'kincal-id',
      matchedBy: 'rnokpp',
    })
  })

  it('should fall through to previousCompanyId when transit and no rnokpp match', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA293052990000029023866100110',
      AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
      previousCompanyId: 'sport-space-id',
    } as ITransaction

    expect(matchCompany(transaction, companies)).toEqual({
      companyId: 'sport-space-id',
      matchedBy: 'previous',
    })
  })

  it('should fall through to name match when account/rnokpp/previous all miss', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA000000000000000000000000001',
      AUT_CNTR_NAM: 'ФОП Payer One',
      AUT_CNTR_CRF: '1111111111',
      RECIPIENT_ULTMT_NCEO: '',
    } as ITransaction

    // Company has NO rnokpp and a different account — only the name lines up.
    expect(
      matchCompany(transaction, [
        { _id: 'payer-id', companyName: 'Payer One' } as IRealestate,
      ])
    ).toEqual({ companyId: 'payer-id', matchedBy: 'name' })
  })

  it('should prioritize previousCompanyId over name', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA000000000000000000000000001',
      AUT_CNTR_NAM: 'ФОП Payer One',
      previousCompanyId: 'prev-id',
    } as ITransaction

    expect(
      matchCompany(transaction, [
        { _id: 'payer-id', companyName: 'Payer One' } as IRealestate,
      ])
    ).toEqual({ companyId: 'prev-id', matchedBy: 'previous' })
  })

  it('should return null result when nothing matches', () => {
    expect(
      matchCompany(
        { AUT_CNTR_ACC: 'UNKNOWN', AUT_CNTR_NAM: 'Random' } as ITransaction,
        mockCompanies
      )
    ).toEqual({
      companyId: null,
      matchedBy: null,
    })
  })
})

describe('getResolvedDescription', () => {
  it('should return AUT_CNTR_ACC if matched by account', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UA293220010000026205305849120',
      AUT_CNTR_NAM: 'Вітюк Дмитро Олександрович',
      OSND: 'Оплата послуг',
    } as ITransaction

    expect(getResolvedDescription(transaction, companies)).toBe(
      'UA293220010000026205305849120'
    )
  })

  it('should return OSND if not matched by account', () => {
    const transaction = {
      AUT_CNTR_ACC: 'UNKNOWN_ACC',
      previousCompanyId: '2',
      OSND: 'Абонемент',
    } as ITransaction

    expect(getResolvedDescription(transaction, mockCompanies)).toBe('Абонемент')
  })

  it('should return empty string if OSND is absent and not matched by account', () => {
    const transaction = { AUT_CNTR_ACC: 'UNKNOWN', OSND: '' } as ITransaction

    expect(getResolvedDescription(transaction, mockCompanies)).toBe('')
  })
})

// Regression: the same counterparty pays from several different bank accounts.
// All account-based matching fails, but AUT_CNTR_CRF (counterparty tax code)
// stays constant across the payments.
describe('payer uses multiple bank accounts', () => {
  const paymentCase1 = {
    AUT_CNTR_CRF: '1111111111',
    AUT_CNTR_MFO: '300001',
    AUT_CNTR_ACC: 'UA000000000000000000000000001',
    AUT_CNTR_NAM: 'ФОП Payer One',
    RECIPIENT_ULTMT_NCEO: '',
    isMatchingPayment: false,
    previousCompanyId: null,
  } as unknown as ITransaction

  const paymentCase2 = {
    AUT_CNTR_CRF: '1111111111',
    AUT_CNTR_MFO: '300001',
    AUT_CNTR_ACC: 'UA000000000000000000000000002',
    AUT_CNTR_NAM: 'КАРТКОВИЙ - ФОП Payer One',
    RECIPIENT_ULTMT_NCEO: '',
    isMatchingPayment: false,
    previousCompanyId: null,
  } as unknown as ITransaction

  // Company was seen before under a *different* account (…000003).
  const payerCompanyWithRnokpp = {
    _id: 'payer-id',
    companyName: 'ФОП Payer One',
    account: 'UA000000000000000000000000003',
    rnokpp: '1111111111',
  } as IRealestate

  const payerCompanyNoRnokpp = {
    _id: 'payer-id',
    companyName: 'ФОП Payer One',
    account: 'UA000000000000000000000000003',
  } as IRealestate

  it('account matching fails: incoming accounts differ from the stored one', () => {
    expect(matchByAccount(paymentCase1, [payerCompanyWithRnokpp])).toBeNull()
    expect(matchByAccount(paymentCase2, [payerCompanyWithRnokpp])).toBeNull()
  })

  it('previous matching fails: server sends previousCompanyId=null', () => {
    expect(matchByPrevious(paymentCase1)).toBeNull()
    expect(matchByPrevious(paymentCase2)).toBeNull()
  })

  it('without a rnokpp on the company, still matches via name fallback', () => {
    expect(matchCompany(paymentCase1, [payerCompanyNoRnokpp])).toEqual({
      companyId: 'payer-id',
      matchedBy: 'name',
    })
    expect(matchCompany(paymentCase2, [payerCompanyNoRnokpp])).toEqual({
      companyId: 'payer-id',
      matchedBy: 'name',
    })
  })

  it('no rnokpp AND a non-matching company name → nothing matches', () => {
    const otherCompany = {
      _id: 'other-id',
      companyName: 'ФОП Різна Людина',
      account: 'UA000000000000000000000000003',
    } as IRealestate

    expect(matchCompany(paymentCase1, [otherCompany])).toEqual({
      companyId: null,
      matchedBy: null,
    })
  })

  it('FIX: matches both payments by AUT_CNTR_CRF regardless of account', () => {
    expect(matchCompany(paymentCase1, [payerCompanyWithRnokpp])).toEqual({
      companyId: 'payer-id',
      matchedBy: 'rnokpp',
    })
    expect(matchCompany(paymentCase2, [payerCompanyWithRnokpp])).toEqual({
      companyId: 'payer-id',
      matchedBy: 'rnokpp',
    })
  })
})
