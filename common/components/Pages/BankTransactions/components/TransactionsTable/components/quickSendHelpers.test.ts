import { getStreetId, buildTransactionPayload } from './quickSendHelpers'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { ITransaction } from './transactionTypes'

const makeCompany = (overrides: Partial<IRealestate> = {}): IRealestate =>
  ({
    _id: 'comp-1',
    companyName: 'Test Company',
    street: { _id: 'street-1', name: 'Test Street' },
    ...overrides,
  } as IRealestate)

const makeTransaction = (overrides: Partial<ITransaction> = {}): ITransaction =>
  ({
    AUT_MY_CRF: '0000000000',
    AUT_MY_MFO: '300000',
    AUT_MY_ACC: 'UA300000000000000000000000001',
    AUT_MY_NAM: 'Тест Т. Є. ФОП',
    AUT_MY_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_MY_MFO_CITY: 'ДНІПРО',
    AUT_CNTR_CRF: '14360570',
    AUT_CNTR_MFO: '300000',
    AUT_CNTR_ACC: 'UA300000000000000000000000002',
    AUT_CNTR_NAM: 'Test Counterparty',
    AUT_CNTR_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_CNTR_MFO_CITY: 'ДНІПРО',
    CCY: 'UAH',
    FL_REAL: 'r',
    PR_PR: 'r',
    DOC_TYP: 'm',
    NUM_DOC: '@TEST001',
    DAT_KL: '19.01.2026',
    DAT_OD: '19.01.2026',
    OSND: 'Payment for services',
    SUM: '1000',
    SUM_E: '1000',
    REF: 'REF001',
    REFN: 'P',
    TIM_P: '12:00',
    DATE_TIME_DAT_OD_TIM_P: '19.01.2026 12:00:00',
    ID: 'TEST001P19012026120000',
    TRANTYPE: 'C',
    DLR: null,
    TECHNICAL_TRANSACTION_ID: 'TECH001',
    isMatchingPayment: false,
    previousCompanyId: null,
    ...overrides,
  } as ITransaction)

describe('getStreetId', () => {
  it('returns undefined when company is undefined', () => {
    expect(getStreetId(undefined)).toBeUndefined()
  })

  it('returns street._id when street is an object', () => {
    const company = makeCompany({ street: { _id: 'street-42', name: 'Main St' } as any })
    expect(getStreetId(company)).toBe('street-42')
  })

  it('returns street directly when street is a string', () => {
    const company = makeCompany({ street: 'street-99' as any })
    expect(getStreetId(company)).toBe('street-99')
  })

  it('returns undefined when street object has no _id', () => {
    const company = makeCompany({ street: { name: 'No Id Street' } as any })
    expect(getStreetId(company)).toBeUndefined()
  })
})

describe('buildTransactionPayload', () => {
  it('copies AUT_CNTR_ACC from transaction', () => {
    const tx = makeTransaction({ AUT_CNTR_ACC: 'UA300000000000000000000000002' })
    const result = buildTransactionPayload(tx, [])
    expect(result.AUT_CNTR_ACC).toBe('UA300000000000000000000000002')
  })

  it('copies AUT_CNTR_NAM from transaction', () => {
    const tx = makeTransaction({ AUT_CNTR_NAM: 'Some Name' })
    const result = buildTransactionPayload(tx, [])
    expect(result.AUT_CNTR_NAM).toBe('Some Name')
  })

  it('copies AUT_CNTR_MFO from transaction', () => {
    const tx = makeTransaction({ AUT_CNTR_MFO: '123456' })
    const result = buildTransactionPayload(tx, [])
    expect(result.AUT_CNTR_MFO).toBe('123456')
  })

  it('copies OSND from transaction', () => {
    const tx = makeTransaction({ OSND: 'Invoice payment' })
    const result = buildTransactionPayload(tx, [])
    expect(result.OSND).toBe('Invoice payment')
  })

  it('copies TECHNICAL_TRANSACTION_ID from transaction', () => {
    const tx = makeTransaction({ TECHNICAL_TRANSACTION_ID: 'TECH-XYZ' })
    const result = buildTransactionPayload(tx, [])
    expect(result.TECHNICAL_TRANSACTION_ID).toBe('TECH-XYZ')
  })

  it('sets Description to OSND when no account match', () => {
    const tx = makeTransaction({ OSND: 'Service fee', AUT_CNTR_ACC: 'UA300000000000000000000000099' })
    const companies: IRealestate[] = [makeCompany({ account: 'UA300000000000000000000000002' })]
    const result = buildTransactionPayload(tx, companies)
    expect(result.Description).toBe('Service fee')
  })

  it('sets Description to AUT_CNTR_ACC when account matches', () => {
    const tx = makeTransaction({
      AUT_CNTR_ACC: 'UA300000000000000000000000002',
      OSND: 'Service fee',
    })
    const companies: IRealestate[] = [makeCompany({ account: 'UA300000000000000000000000002' })]
    const result = buildTransactionPayload(tx, companies)
    expect(result.Description).toBe('UA300000000000000000000000002')
  })
})
