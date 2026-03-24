import '@testing-library/jest-dom'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form } from 'antd'
import UpdateInvoiceButton from './UpdateInvoiceButton'
import { ServiceType } from '@utils/constants'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    company: { garbageCollector: true, rentPart: 50 },
    service: { garbageCollectorPrice: 500 },
    prevService: null,
    prevPayment: null,
  }),
}))

jest.mock('@utils/getInvoices', () => ({
  getMaintenanceInvoice: jest.fn(),
  getPlacingInvoice: jest.fn(),
  getInflicionInvoice: jest.fn(),
  getElectricityInvoice: jest.fn(),
  getWaterInvoice: jest.fn(),
  getWaterPartInvoice: jest.fn(),
  getGarbageCollectorInvoice: jest.fn(),
  getCleaningInvoice: jest.fn(),
  getDiscountInvoice: jest.fn(),
}))

const { getGarbageCollectorInvoice: mockGetGarbageCollectorInvoice } =
  jest.requireMock('@utils/getInvoices') as {
    getGarbageCollectorInvoice: jest.Mock
  }

describe('UpdateInvoiceButton', () => {
  beforeEach(() => {
    mockGetGarbageCollectorInvoice.mockReset()
    mockGetGarbageCollectorInvoice.mockReturnValue({
      type: ServiceType.GarbageCollector,
      price: 250,
      sum: 250,
    })
  })

  it('restores garbage collector invoice even when current form values are strings', async () => {
    const useWatchSpy = jest.spyOn(Form, 'useWatch')
    const setFieldValue = jest.fn()
    const getFieldValue = jest.fn().mockReturnValue([
      {
        type: ServiceType.GarbageCollector,
        price: '100',
        sum: '100',
      },
    ])

    useWatchSpy.mockReturnValue({
      type: ServiceType.GarbageCollector,
      price: '100',
      sum: '100',
    })

    render(
      <UpdateInvoiceButton
        form={{ getFieldValue, setFieldValue } as any}
        name={0}
        serviceType={ServiceType.GarbageCollector}
      />
    )

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenCalledWith(['invoice', 0, 'price'], 250)
      expect(setFieldValue).toHaveBeenCalledWith(['invoice', 0, 'sum'], 250)
    })

    useWatchSpy.mockRestore()
  })
})