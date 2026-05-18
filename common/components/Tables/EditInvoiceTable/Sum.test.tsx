import '@testing-library/jest-dom'
import { describe, expect, it, jest } from '@jest/globals'
import { render } from '@testing-library/react'
import { Form } from 'antd'
import { Sum as MaintenanceSum } from './Maintenance'
import { Sum as CleaningSum } from './Cleaning'
import { Sum as DiscountSum } from './Discount'
import { Sum as GarbageCollectorSum } from './GarbageCollector'
import { Sum as WaterSum } from './Water'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    company: { currency: '₴' },
    service: null,
    prevService: null,
    prevPayment: null,
  }),
}))

/**
 * Each Sum component is a thin wrapper around `useSyncSum(form, name, X)`
 * where X is the type-specific formula. We exercise the formula by feeding
 * watched values via Form.useWatch and asserting the resulting setFieldValue
 * write.
 */
const renderSumWithWatched = (
  Component: React.FC<any>,
  watched: Record<string, unknown>
) => {
  const setFieldValue = jest.fn()
  const useWatchSpy = jest
    .spyOn(Form, 'useWatch')
    .mockImplementation((path: any) => {
      const key = Array.isArray(path) ? path[path.length - 1] : path
      return watched[key as string] as any
    })

  render(<Component form={{ setFieldValue } as any} name={0} />)

  return { setFieldValue, useWatchSpy }
}

const lastWriteToSum = (mock: jest.Mock) =>
  mock.mock.calls
    .filter((call) => Array.isArray(call[0]) && call[0][2] === 'sum')
    .at(-1)?.[1]

describe('Sum components', () => {
  describe('Maintenance', () => {
    it('writes price * amount', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(
        MaintenanceSum,
        { price: 12, amount: 50 }
      )
      expect(lastWriteToSum(setFieldValue)).toBe(600)
      useWatchSpy.mockRestore()
    })

    it('coerces string inputs', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(
        MaintenanceSum,
        { price: '12', amount: '50' }
      )
      expect(lastWriteToSum(setFieldValue)).toBe(600)
      useWatchSpy.mockRestore()
    })
  })

  describe('Cleaning', () => {
    it('writes price (amount-independent)', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(CleaningSum, {
        price: 250,
      })
      expect(lastWriteToSum(setFieldValue)).toBe(250)
      useWatchSpy.mockRestore()
    })

    it('writes 0 when price is missing', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(CleaningSum, {
        price: undefined,
      })
      expect(lastWriteToSum(setFieldValue)).toBe(0)
      useWatchSpy.mockRestore()
    })
  })

  describe('Discount', () => {
    it('writes price (allowing negatives)', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(DiscountSum, {
        price: -100,
      })
      expect(lastWriteToSum(setFieldValue)).toBe(-100)
      useWatchSpy.mockRestore()
    })
  })

  describe('GarbageCollector', () => {
    it('writes price', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(
        GarbageCollectorSum,
        { price: 250 }
      )
      expect(lastWriteToSum(setFieldValue)).toBe(250)
      useWatchSpy.mockRestore()
    })
  })

  describe('Water', () => {
    it('writes (amount - lastAmount) * price', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(WaterSum, {
        amount: 110,
        lastAmount: 100,
        price: 30,
      })
      expect(lastWriteToSum(setFieldValue)).toBe(300)
      useWatchSpy.mockRestore()
    })

    it('clamps to 0 when amount < lastAmount (avoid negative bills on bad reading)', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(WaterSum, {
        amount: 90,
        lastAmount: 100,
        price: 30,
      })
      expect(lastWriteToSum(setFieldValue)).toBe(0)
      useWatchSpy.mockRestore()
    })

    it('coerces string inputs', () => {
      const { setFieldValue, useWatchSpy } = renderSumWithWatched(WaterSum, {
        amount: '110',
        lastAmount: '100',
        price: '30',
      })
      expect(lastWriteToSum(setFieldValue)).toBe(300)
      useWatchSpy.mockRestore()
    })
  })
})
