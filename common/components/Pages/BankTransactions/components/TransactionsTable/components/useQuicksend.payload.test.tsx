import { act, renderHook } from '@testing-library/react'
import dayjs from 'dayjs'
import { useQuickSend } from './useQuicksend'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import { getPaymentProviderAndReciever } from '@utils/helpers'

// This suite pins down WHY a quick-sent invoice differs from a normally-sent
// one. Unlike useQuicksend.test.tsx, it does NOT mock @utils/helpers, so the
// real getPaymentProviderAndReciever runs and we can compare the provider /
// reciever that quick-send actually produces against the "golden" shape that
// the standard AddPaymentModal flow (buildPaymentPayload) sends.
//
// The standard flow calls getPaymentProviderAndReciever(company) — a single
// company argument. Any test below that fails localises a real divergence.

const mockAddPayment = jest
  .fn()
  .mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ data: {} }) })
const mockAddService = jest.fn().mockReturnValue({
  unwrap: jest.fn().mockResolvedValue({ data: { _id: 'service_123' } }),
})

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn().mockReturnValue({ data: { data: [] } }),
  useAddServiceMutation: jest.fn(() => [mockAddService]),
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useAddPaymentMutation: jest.fn(() => [mockAddPayment]),
  useGetPaymentNumberQuery: jest.fn().mockReturnValue({ data: 1 }),
}))

jest.mock('./bankHelper', () => ({
  getResolvedDescription: jest.fn().mockReturnValue('description'),
}))

// getStreetId/buildTransactionPayload are pure and safe to keep real, but the
// existing suite mocks them; mirror that so behaviour is identical here.
jest.mock('./quickSendHelpers', () => ({
  getStreetId: jest.fn().mockReturnValue('street_1'),
  buildTransactionPayload: jest.fn().mockReturnValue({ payload: true }),
}))

describe('useQuickSend — payment payload parity with the standard send', () => {
  const transaction = {
    AUT_CNTR_ACC: 'UA123',
    AUT_CNTR_NAM: 'Receiver',
    AUT_CNTR_MFO: '123456',
    OSND: 'Payment description',
    SUM: '1000',
    TECHNICAL_TRANSACTION_ID: 'tx_001',
    DAT_OD: '03.05.2026',
  } as any

  const domain = { _id: 'domain_1', description: 'domain desc' } as any

  // A realistic company as it comes from useGetAllRealEstateQuery: it carries
  // companyName / adminEmails / description and a nested domain.
  const company = {
    _id: 'company_1',
    companyName: 'Acme LLC',
    adminEmails: ['owner@acme.co'],
    description: 'Acme company note',
    street: { _id: 'street_1' },
    domain: { description: 'domain desc' },
  } as any

  const relatedCompanies = [company]

  beforeAll(() => {
    ;(global as any).BroadcastChannel = jest.fn().mockImplementation(() => ({
      postMessage: jest.fn(),
      close: jest.fn(),
    }))
  })

  beforeEach(() => {
    mockAddPayment.mockClear()
    mockAddService.mockClear()
  })

  const runQuickSend = async () => {
    const placeholderId = buildMonthServicePlaceholder(dayjs('2026-05-03'))
    const { result } = renderHook(() =>
      useQuickSend({
        transaction,
        domain,
        selectedCompanyId: 'company_1',
        relatedCompanies,
      })
    )
    await act(async () => {
      await result.current.handleQuickSend({
        _id: placeholderId,
        date: '2026-05-03',
      } as any)
    })
    return mockAddPayment.mock.calls[0][0]
  }

  it('sends the same reciever the standard flow builds for the company', async () => {
    const payload = await runQuickSend()
    const golden = getPaymentProviderAndReciever(company)

    expect(payload.reciever).toEqual(golden.reciever)
  })

  it('sends the same provider the standard flow builds for the company', async () => {
    const payload = await runQuickSend()
    const golden = getPaymentProviderAndReciever(company)

    expect(payload.provider).toEqual(golden.provider)
  })

  it('populates reciever.companyName (a matched company always has a name)', async () => {
    const payload = await runQuickSend()
    expect(payload.reciever?.companyName).toBe('Acme LLC')
  })

  it('populates reciever.adminEmails from the company', async () => {
    const payload = await runQuickSend()
    expect(payload.reciever?.adminEmails).toEqual(['owner@acme.co'])
  })
})
