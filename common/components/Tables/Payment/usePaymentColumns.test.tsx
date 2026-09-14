import { renderHook } from '@testing-library/react'
import { buildDateFilters, usePaymentColumns } from './usePaymentColumns'
import { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'

describe('Payment Columns Date Filtering', () => {
  describe('buildDateFilters()', () => {
    it('повинен повертати порожній масив, якщо дата-фільтри відсутні', () => {
      const result = buildDateFilters(undefined)
      expect(result).toEqual([])
    })

    it('повинен коректно генерувати структуру фільтрів років і місяців', () => {
      const mockDateFilters = {
        monthFilter: [
          { value: '1', text: 'January' },
          { value: '2', text: 'February' },
        ],
        yearFilter: [
          { value: '2025', text: '2025' },
          { value: '2026', text: '2026' },
        ],
      } as IPaymentFilterResponse

      const filters = buildDateFilters(mockDateFilters)
      expect(filters.length).toBeGreaterThanOrEqual(2)

      const filter2026 = filters.find((f) => f.value === '2026')
      expect(filter2026).toBeDefined()
      expect(filter2026?.text).toBe('2026')

      expect(filter2026?.children.length).toBe(2)
      expect(filter2026?.children[0].value).toBe('2026-month-1')
      expect(filter2026?.children[0].text).toBeTruthy()
    })
  })

  describe('колонка "За місяць" (фільтр monthService)', () => {
    const mockDateFilters = {
      monthFilter: [{ value: '1', text: 'January' }],
      yearFilter: [{ value: '2026', text: '2026' }],
    } as IPaymentFilterResponse

    const baseParams = {
      filters: {},
      setFilters: jest.fn(),
      domainsFilter: [],
      companiesFilter: [],
      dateFilters: mockDateFilters,
      debtorCompanies: [],
      selectedColumns: [],
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: true,
      onViewClick: jest.fn(),
      onEditClick: jest.fn(),
      onDelete: jest.fn(),
      onMarkPaid: jest.fn(),
      onDuplicate: jest.fn(),
      deleteLoading: false,
    }

    const getMonthServiceColumn = (params: any) => {
      const { result } = renderHook(() => usePaymentColumns(params))
      return result.current.find((c: any) => c.dataIndex === 'monthService')
    }

    it('використовує ту саму структуру фільтрів (рік/місяць), що й invoiceCreationDate', () => {
      const column = getMonthServiceColumn(baseParams)

      expect(column?.filters).toEqual(buildDateFilters(mockDateFilters))
    })

    it('не має власного filteredValue, поки фільтр monthService не застосовано', () => {
      const column = getMonthServiceColumn(baseParams)

      expect(column?.filteredValue).toBeNull()
    })

    it('відображає застосований фільтр monthService незалежно від invoiceCreationDate', () => {
      const column = getMonthServiceColumn({
        ...baseParams,
        filters: {
          invoiceCreationDate: ['2025-month-1'],
          monthService: ['2026-month-1'],
        },
      })

      expect(column?.filteredValue).toEqual(['2026-month-1'])
    })

    it('приховує фільтр колонки для окремого домену (sepDomainID)', () => {
      const column = getMonthServiceColumn({
        ...baseParams,
        sepDomainID: 'domain-1',
      })

      expect(column?.filters).toEqual([])
    })
  })
})