import { renderHook } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'

import { setFilters } from '@modules/store/paymentsSlice'
import { usePaymentsFilterUrlSync } from './usePaymentsFilterUrlSync'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

const mockRouter = (query: Record<string, string | string[]> = {}) => {
  const replace = jest.fn()
  ;(useRouter as jest.Mock).mockReturnValue({
    pathname: '/payment',
    query,
    isReady: true,
    replace,
  })
  return replace
}

const mockFilters = (filters?: Record<string, any>) => {
  ;(useSelector as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({ payments: { filters } })
  )
}

describe('usePaymentsFilterUrlSync()', () => {
  let dispatch: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    dispatch = jest.fn()
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(dispatch)
    mockFilters(undefined)
  })

  describe('URL → Redux', () => {
    it('накладає фільтр за місяцем із посилання зі сторінки прибутків', () => {
      mockRouter({ monthService: '2026-07' })

      renderHook(() => usePaymentsFilterUrlSync({ enabled: true }))

      expect(dispatch).toHaveBeenCalledWith(
        setFilters({ invoiceCreationDate: [], monthService: ['2026-month-7'] })
      )
    })

    it('не чіпає решту фільтрів, що вже є в сторі', () => {
      mockFilters({ domain: ['domain-1'] })
      mockRouter({ monthService: '2026-07' })

      renderHook(() => usePaymentsFilterUrlSync({ enabled: true }))

      expect(dispatch).toHaveBeenCalledWith(
        setFilters({
          domain: ['domain-1'],
          invoiceCreationDate: [],
          monthService: ['2026-month-7'],
        })
      )
    })

    it('знімає фільтр за датою створення, який бекенд усе одно проігнорує', () => {
      mockFilters({ invoiceCreationDate: ['2025-month-1'] })
      mockRouter({ monthService: '2026-07' })

      renderHook(() => usePaymentsFilterUrlSync({ enabled: true }))

      expect(dispatch).toHaveBeenCalledWith(
        setFilters({ invoiceCreationDate: [], monthService: ['2026-month-7'] })
      )
    })

    it('відновлює проміжок дат із ?dateFrom=&dateTo=', () => {
      mockFilters({ domain: ['domain-1'] })
      mockRouter({ dateFrom: '2026-08-01', dateTo: '2026-09-28' })

      renderHook(() => usePaymentsFilterUrlSync({ enabled: true }))

      expect(dispatch).toHaveBeenCalledWith(
        setFilters({
          domain: ['domain-1'],
          dateFrom: '2026-08-01',
          dateTo: '2026-09-28',
        })
      )
    })

    it('відновлює проміжок дат разом із місяцем послуг', () => {
      mockRouter({
        monthService: '2026-07',
        dateFrom: '2026-08-01',
        dateTo: '2026-09-28',
      })

      renderHook(() => usePaymentsFilterUrlSync({ enabled: true }))

      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith(
        setFilters({
          invoiceCreationDate: [],
          monthService: ['2026-month-7'],
          dateFrom: '2026-08-01',
          dateTo: '2026-09-28',
        })
      )
    })

    it.each([
      [{ dateFrom: '2026-08-01' }],
      [{ dateFrom: '2026-02-30', dateTo: '2026-03-01' }],
      [{ dateFrom: '01.08.2026', dateTo: '28.09.2026' }],
    ])('ігнорує неповний або битий проміжок у URL: %o', (query) => {
      mockRouter(query)

      renderHook(() => usePaymentsFilterUrlSync({ enabled: true }))

      expect(dispatch).not.toHaveBeenCalled()
    })

    it('лишає сторінку працювати як раніше, коли параметра в URL немає', () => {
      mockRouter({})

      const { result } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )

      expect(dispatch).not.toHaveBeenCalled()
      expect(result.current.isUrlApplied).toBe(true)
    })

    it('притримує запит платежів, доки роутер не віддасть query', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/payment',
        query: {},
        isReady: false,
        replace: jest.fn(),
      })

      const { result } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )

      expect(result.current.isUrlApplied).toBe(false)
    })

    it('нічого не робить там, де фільтрів за URL немає (дашборд)', () => {
      const replace = mockRouter({ monthService: '2026-07' })

      const { result } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: false })
      )

      expect(dispatch).not.toHaveBeenCalled()
      expect(replace).not.toHaveBeenCalled()
      expect(result.current.isUrlApplied).toBe(true)
    })
  })

  describe('Redux → URL', () => {
    it('записує обраний користувачем місяць в URL', () => {
      const replace = mockRouter({})

      const { rerender } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )
      mockFilters({ monthService: ['2026-month-7'] })
      rerender()

      expect(replace).toHaveBeenCalledWith(
        { pathname: '/payment', query: { monthService: '2026-07' } },
        undefined,
        { shallow: true }
      )
    })

    it('прибирає параметр, коли фільтр скинули', () => {
      const replace = mockRouter({ monthService: '2026-07' })

      const { rerender } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )
      mockFilters({ monthService: [] })
      rerender()

      expect(replace).toHaveBeenCalledWith(
        { pathname: '/payment', query: {} },
        undefined,
        { shallow: true }
      )
    })

    it('зберігає інші параметри URL недоторканими', () => {
      const replace = mockRouter({ tab: 'all' })

      const { rerender } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )
      mockFilters({ monthService: ['2026-month-7'] })
      rerender()

      expect(replace).toHaveBeenCalledWith(
        {
          pathname: '/payment',
          query: { tab: 'all', monthService: '2026-07' },
        },
        undefined,
        { shallow: true }
      )
    })

    it('записує обраний проміжок дат в URL', () => {
      const replace = mockRouter({ tab: 'all' })

      const { rerender } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )
      mockFilters({
        domain: ['domain-1'],
        dateFrom: '2026-08-01',
        dateTo: '2026-09-28',
      })
      rerender()

      expect(replace).toHaveBeenCalledWith(
        {
          pathname: '/payment',
          query: { tab: 'all', dateFrom: '2026-08-01', dateTo: '2026-09-28' },
        },
        undefined,
        { shallow: true }
      )
    })

    it('прибирає проміжок дат з URL після очищення, лишаючи місяць послуг', () => {
      const replace = mockRouter({
        monthService: '2026-07',
        dateFrom: '2026-08-01',
        dateTo: '2026-09-28',
      })
      mockFilters({
        monthService: ['2026-month-7'],
        dateFrom: '2026-08-01',
        dateTo: '2026-09-28',
      })

      const { rerender } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )
      mockFilters({ monthService: ['2026-month-7'] })
      rerender()

      expect(replace).toHaveBeenCalledWith(
        { pathname: '/payment', query: { monthService: '2026-07' } },
        undefined,
        { shallow: true }
      )
    })

    it('не переписує URL, коли проміжок у ньому вже актуальний', () => {
      const query = { dateFrom: '2026-08-01', dateTo: '2026-09-28' }
      const replace = mockRouter(query)
      mockFilters(query)

      const { rerender } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )
      rerender()

      expect(replace).not.toHaveBeenCalled()
    })

    it('не переписує URL, коли він уже описує поточний фільтр', () => {
      const replace = mockRouter({ monthService: '2026-07' })
      mockFilters({ monthService: ['2026-month-7'] })

      const { rerender } = renderHook(() =>
        usePaymentsFilterUrlSync({ enabled: true })
      )
      rerender()

      expect(replace).not.toHaveBeenCalled()
    })
  })
})
