import {
  matchCompany,
  matchByAccount,
  matchByRnokpp,
  matchByPrevious,
  getResolvedDescription,
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
