import * as React from 'react'
import { act, renderHook } from '@testing-library/react'
import dayjs from 'dayjs'
import { useQuickSend } from './useQuicksend'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'

const mockAddPayment = jest
  .fn()
  .mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ data: {} }) })
const mockAddService = jest.fn().mockReturnValue({
  unwrap: jest.fn().mockResolvedValue({ data: { _id: 'service_123' } }),
})
const mockPostMessage = jest.fn()
const mockClose = jest.fn()

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn().mockReturnValue({ data: { data: [] } }),
  useAddServiceMutation: jest.fn(() => [mockAddService]),
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useAddPaymentMutation: jest.fn(() => [mockAddPayment]),
  useGetPaymentNumberQuery: jest.fn().mockReturnValue({ data: 1 }),
}))

jest.mock('@utils/helpers', () => ({
  getPaymentProviderAndReciever: jest
    .fn()
    .mockReturnValue({ provider: 'provider', reciever: 'reciever' }),
}))

jest.mock('./bankHelper', () => ({
  getResolvedDescription: jest.fn().mockReturnValue('description'),
}))

jest.mock('./quickSendHelpers', () => ({
  getStreetId: jest.fn().mockReturnValue('street_1'),
  buildTransactionPayload: jest.fn().mockReturnValue({ payload: true }),
}))

describe('useQuickSend', () => {
  const transaction = {
    AUT_CNTR_ACC: 'UA123',
    AUT_CNTR_NAM: 'Receiver',
    AUT_CNTR_MFO: '123456',
    OSND: 'Payment description',
    SUM: '1000',
    TECHNICAL_TRANSACTION_ID: 'tx_001',
    DAT_OD: '03.05.2026',
  } as any

  const domain = { _id: 'domain_1' } as any
  const relatedCompanies = [
    { _id: 'company_1', street: { _id: 'street_1' } },
  ] as any

  beforeAll(() => {
    ;(global as any).BroadcastChannel = jest.fn().mockImplementation(() => ({
      postMessage: mockPostMessage,
      close: mockClose,
    }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockAddPayment.mockClear()
    mockAddService.mockClear()
    mockPostMessage.mockClear()
    mockClose.mockClear()
  })

  it('uses next invoice number from payment number query', async () => {
    const {
      useGetPaymentNumberQuery,
    } = require('@common/api/paymentApi/payment.api')
    useGetPaymentNumberQuery.mockReturnValue({ data: 42 })

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
        _id: 'service_1',
        date: '2026-05-03',
      } as any)
    })

    expect(mockAddPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: 42,
      })
    )
  })

  it('creates service for placeholder month and uses its id for monthService', async () => {
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

    expect(mockAddService).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'domain_1',
        street: 'street_1',
        rentPrice: 0,
        electricityPrice: 0,
        waterPrice: 0,
        waterPriceTotal: 0,
        description: '',
        customServices: [],
      })
    )
    expect(mockAddPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        monthService: 'service_123',
      })
    )
  })

  it('normalises the service date to noon UTC on the 1st of the picked month', async () => {
    // Regression: startOf('month').toDate() shifted May -> Apr 30 21:00 UTC in
    // +NN timezones. The service date must land on the 1st regardless of TZ.
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

    const createdDate = mockAddService.mock.calls[0][0].date as Date
    expect(createdDate.getUTCFullYear()).toBe(2026)
    expect(createdDate.getUTCMonth()).toBe(4) // May (0-indexed)
    expect(createdDate.getUTCDate()).toBe(1)
  })

  it('omits street from both service and payment payloads when the company has no street', async () => {
    const { getStreetId } = require('./quickSendHelpers')
    ;(getStreetId as jest.Mock).mockReturnValue(undefined)
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

    // '' would fail the backend ObjectId cast — the key must be absent entirely
    // on both the service create and the payment create.
    expect(mockAddService.mock.calls[0][0]).not.toHaveProperty('street')
    expect(mockAddPayment.mock.calls[0][0]).not.toHaveProperty('street')
  })

  it('uses transaction DAT_OD as invoiceCreationDate when available', async () => {
    const customTransaction = { ...transaction, DAT_OD: '03.05.2026' } as any
    const { result } = renderHook(() =>
      useQuickSend({
        transaction: customTransaction,
        domain,
        selectedCompanyId: 'company_1',
        relatedCompanies,
      })
    )

    await act(async () => {
      await result.current.handleQuickSend({
        _id: 'service_1',
        date: '2026-05-01',
      } as any)
    })

    const calledPayment = mockAddPayment.mock.calls[0][0]
    const createdDate = calledPayment.invoiceCreationDate as Date

    expect(createdDate.getFullYear()).toBe(2026)
    expect(createdDate.getMonth()).toBe(4)
    expect(createdDate.getDate()).toBe(3)
  })

  it('falls back to service date when transaction DAT_OD is missing', async () => {
    const customTransaction = { ...transaction, DAT_OD: undefined } as any
    const { result } = renderHook(() =>
      useQuickSend({
        transaction: customTransaction,
        domain,
        selectedCompanyId: 'company_1',
        relatedCompanies,
      })
    )

    await act(async () => {
      await result.current.handleQuickSend({
        _id: 'service_1',
        date: '2026-05-15',
      } as any)
    })

    const calledPayment = mockAddPayment.mock.calls[0][0]
    const createdDate = calledPayment.invoiceCreationDate as Date

    expect(createdDate.getFullYear()).toBe(2026)
    expect(createdDate.getMonth()).toBe(4)
    expect(createdDate.getDate()).toBe(15)
  })

  it('calls onSuccess callback after successful send', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() =>
      useQuickSend({
        transaction,
        domain,
        selectedCompanyId: 'company_1',
        relatedCompanies,
        onSuccess,
      })
    )

    await act(async () => {
      await result.current.handleQuickSend({
        _id: 'service_1',
        date: '2026-05-01',
      } as any)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('sends PAYMENT_CREATED message through BroadcastChannel', async () => {
    jest.useFakeTimers()
    try {
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
          _id: 'service_1',
          date: '2026-05-01',
        } as any)
      })

      expect(global.BroadcastChannel).toHaveBeenCalledWith(
        'payments_sync_channel'
      )
      expect(mockPostMessage).toHaveBeenCalledWith('PAYMENT_CREATED')

      act(() => {
        jest.advanceTimersByTime(100)
      })
      expect(mockClose).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})
