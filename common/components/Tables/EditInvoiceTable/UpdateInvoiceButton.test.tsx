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

  it('writes service-driven price even when current form values are strings', async () => {
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
    })
    // `sum` is intentionally NOT written by the button — derived fields are
    // recomputed by each invoice type's Sum component via its own useEffect.
    // Asserting we did NOT touch sum keeps the responsibility boundary clean.
    expect(setFieldValue).not.toHaveBeenCalledWith(
      ['invoice', 0, 'sum'],
      expect.anything()
    )

    useWatchSpy.mockRestore()
  })

  it('does NOT touch user-driven `amount` for electricity (preserves saved meter reading)', async () => {
    const { getElectricityInvoice: mockGetElectricityInvoice } =
      jest.requireMock('@utils/getInvoices') as {
        getElectricityInvoice: jest.Mock
      }
    mockGetElectricityInvoice.mockReturnValue({
      type: ServiceType.Electricity,
      amount: 30553, // would-reset to prevAmount, but must NOT be written
      lastAmount: 30553,
      price: 11, // service price changed
      losses: 6.84,
      sum: 0,
    })

    const useWatchSpy = jest.spyOn(Form, 'useWatch')
    const setFieldValue = jest.fn()
    const getFieldValue = jest.fn().mockReturnValue([
      {
        type: ServiceType.Electricity,
        amount: 32097, // user's saved reading
        lastAmount: 30553,
        price: 14.99,
      },
    ])
    useWatchSpy.mockReturnValue({
      type: ServiceType.Electricity,
      amount: 32097,
      lastAmount: 30553,
      price: 14.99,
    })

    render(
      <UpdateInvoiceButton
        form={{ getFieldValue, setFieldValue } as any}
        name={0}
        serviceType={ServiceType.Electricity}
      />
    )

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenCalledWith(['invoice', 0, 'price'], 11)
    })
    expect(setFieldValue).toHaveBeenCalledWith(
      ['invoice', 0, 'lastAmount'],
      30553
    )
    expect(setFieldValue).toHaveBeenCalledWith(['invoice', 0, 'losses'], 6.84)
    // The whole point of the regression: meter reading must survive a refresh.
    expect(setFieldValue).not.toHaveBeenCalledWith(
      ['invoice', 0, 'amount'],
      expect.anything()
    )
    // sum is also derived → must NOT be touched.
    expect(setFieldValue).not.toHaveBeenCalledWith(
      ['invoice', 0, 'sum'],
      expect.anything()
    )

    useWatchSpy.mockRestore()
  })

  // -------- Visibility (hasChanges) tests --------
  // The button should appear ONLY when service- or prev-driven fields diverge
  // between the saved invoice and the recomputed expectation. User-driven
  // fields (amount for electricity/water) and derived fields (sum) must be
  // ignored in this comparison.

  const renderButton = (serviceType: ServiceType, currentInvoice: any) => {
    const useWatchSpy = jest.spyOn(Form, 'useWatch')
    const setFieldValue = jest.fn()
    const getFieldValue = jest.fn().mockReturnValue([currentInvoice])
    useWatchSpy.mockReturnValue(currentInvoice)

    const result = render(
      <UpdateInvoiceButton
        form={{ getFieldValue, setFieldValue } as any}
        name={0}
        serviceType={serviceType}
      />
    )
    return { ...result, useWatchSpy, setFieldValue }
  }

  it('hides when expectedInvoice matches the current saved invoice (no diff)', () => {
    mockGetGarbageCollectorInvoice.mockReturnValue({
      type: ServiceType.GarbageCollector,
      price: 250,
      sum: 250,
    })
    const { useWatchSpy } = renderButton(ServiceType.GarbageCollector, {
      type: ServiceType.GarbageCollector,
      price: 250,
      sum: 250,
    })

    expect(screen.queryByRole('button')).toBeNull()
    useWatchSpy.mockRestore()
  })

  it('shows when service-driven `price` diverges (Inflicion)', () => {
    const { getInflicionInvoice: mockGetInflicionInvoice } = jest.requireMock(
      '@utils/getInvoices'
    ) as {
      getInflicionInvoice: jest.Mock
    }
    mockGetInflicionInvoice.mockReturnValue({
      type: ServiceType.Inflicion,
      price: 200, // service updated
      sum: 200,
    })
    const { useWatchSpy } = renderButton(ServiceType.Inflicion, {
      type: ServiceType.Inflicion,
      price: 100, // saved
      sum: 100,
    })

    expect(screen.queryByRole('button')).not.toBeNull()
    useWatchSpy.mockRestore()
  })

  it('shows when prev-driven `lastAmount` diverges (Electricity)', () => {
    const { getElectricityInvoice: mockGetElectricityInvoice } =
      jest.requireMock('@utils/getInvoices') as {
        getElectricityInvoice: jest.Mock
      }
    mockGetElectricityInvoice.mockReturnValue({
      type: ServiceType.Electricity,
      amount: 30000,
      lastAmount: 30000, // prev changed
      price: 14.99,
      losses: 15,
      sum: 0,
    })
    const { useWatchSpy } = renderButton(ServiceType.Electricity, {
      type: ServiceType.Electricity,
      amount: 32097,
      lastAmount: 28000, // saved with old prev
      price: 14.99,
      losses: 15,
    })

    expect(screen.queryByRole('button')).not.toBeNull()
    useWatchSpy.mockRestore()
  })

  it('shows when service-driven `losses` diverges (Electricity)', () => {
    const { getElectricityInvoice: mockGetElectricityInvoice } =
      jest.requireMock('@utils/getInvoices') as {
        getElectricityInvoice: jest.Mock
      }
    mockGetElectricityInvoice.mockReturnValue({
      type: ServiceType.Electricity,
      amount: 30000,
      lastAmount: 30000,
      price: 14.99,
      losses: 7, // service updated
      sum: 0,
    })
    const { useWatchSpy } = renderButton(ServiceType.Electricity, {
      type: ServiceType.Electricity,
      amount: 32097,
      lastAmount: 30000,
      price: 14.99,
      losses: 15, // saved
    })

    expect(screen.queryByRole('button')).not.toBeNull()
    useWatchSpy.mockRestore()
  })

  it('hides when only user-driven `amount` differs (Electricity meter reading)', () => {
    const { getElectricityInvoice: mockGetElectricityInvoice } =
      jest.requireMock('@utils/getInvoices') as {
        getElectricityInvoice: jest.Mock
      }
    mockGetElectricityInvoice.mockReturnValue({
      type: ServiceType.Electricity,
      amount: 30000, // expected from-scratch defaults to prevAmount
      lastAmount: 30000,
      price: 14.99,
      losses: 15,
      sum: 0,
    })
    const { useWatchSpy } = renderButton(ServiceType.Electricity, {
      type: ServiceType.Electricity,
      amount: 32810, // user's saved reading — diverges but is user-driven
      lastAmount: 30000,
      price: 14.99,
      losses: 15,
    })

    expect(screen.queryByRole('button')).toBeNull()
    useWatchSpy.mockRestore()
  })

  it('hides when only derived `sum` differs', () => {
    mockGetGarbageCollectorInvoice.mockReturnValue({
      type: ServiceType.GarbageCollector,
      price: 250,
      sum: 0, // expected before Sum.useEffect recomputes
    })
    const { useWatchSpy } = renderButton(ServiceType.GarbageCollector, {
      type: ServiceType.GarbageCollector,
      price: 250,
      sum: 250, // recomputed by Sum.useEffect
    })

    expect(screen.queryByRole('button')).toBeNull()
    useWatchSpy.mockRestore()
  })

  it('shows for Placing when service-driven `price` diverges (e.g. rent updated)', () => {
    const { getPlacingInvoice: mockGetPlacingInvoice } = jest.requireMock(
      '@utils/getInvoices'
    ) as {
      getPlacingInvoice: jest.Mock
    }
    mockGetPlacingInvoice.mockReturnValue({
      type: ServiceType.Placing,
      amount: 109.2,
      price: 12, // service updated
      sum: 1310.4,
    })
    const { useWatchSpy } = renderButton(ServiceType.Placing, {
      type: ServiceType.Placing,
      amount: 109.2,
      price: 10, // saved
      sum: 1092,
    })

    expect(screen.queryByRole('button')).not.toBeNull()
    useWatchSpy.mockRestore()
  })
})
