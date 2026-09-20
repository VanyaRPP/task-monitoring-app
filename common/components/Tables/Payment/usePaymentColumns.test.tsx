import React from 'react'
import { render, renderHook, screen } from '@testing-library/react'

import { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'
import { buildDateFilters, usePaymentColumns } from './usePaymentColumns'

jest.mock('antd', () => {
  const React = require('react')
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    Tooltip: ({
      title,
      children,
    }: {
      title: React.ReactNode
      children: React.ReactNode
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement('span', { 'data-testid': 'tooltip-title' }, title),
        children
      ),
  }
})

const setWidths = (scrollWidth: number, clientWidth: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  })
}

const baseParams = {
  filters: {},
  setFilters: jest.fn(),
  domainsFilter: [],
  companiesFilter: [],
  debtorCompanies: [],
  selectedColumns: [],
  isGlobalAdmin: true,
  isDomainAdmin: false,
  isUser: false,
  onViewClick: jest.fn(),
  onEditClick: jest.fn(),
  onDelete: jest.fn(),
  onMarkPaid: jest.fn(),
  onDuplicate: jest.fn(),
  onSendPaymentEmail: jest.fn(),
  onUpdatePaymentStatus: jest.fn(),
  deleteLoading: false,
}

const Harness: React.FC<{ domainName: string }> = ({ domainName }) => {
  const columns = usePaymentColumns({
    ...baseParams,
    sepDomainID: 'd1',
  } as any)
  const column = (columns as any[]).find((c) => c.dataIndex === 'domain')
  return <>{column.render({ _id: 'd1', name: domainName })}</>
}

describe('usePaymentColumns company name inside the debt Badge', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('caps a long company name with an explicit max-width (Badge has no width of its own to constrain a percentage-based one)', () => {
    setWidths(50, 50)
    const longName =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'

    const CompanyHarness: React.FC = () => {
      const columns = usePaymentColumns(baseParams as any)
      const column = (columns as any[]).find((c) => c.dataIndex === 'company')
      return (
        <>{column.render({ _id: 'c1', companyName: longName }, {} as any, 0)}</>
      )
    }

    render(<CompanyHarness />)

    expect(screen.getByText(longName)).toHaveStyle({ maxWidth: '140px' })
  })
})

describe('usePaymentColumns domain name (single-domain view)', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short domain name in full with no tooltip', () => {
    setWidths(50, 50)
    render(<Harness domainName="Rozetka" />)

    expect(screen.getByText('Rozetka')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip-title')).not.toBeInTheDocument()
  })

  it('truncates a long domain name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    render(<Harness domainName={longName} />)

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })
})

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

    const monthServiceParams = {
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
      const column = getMonthServiceColumn(monthServiceParams)

      expect(column?.filters).toEqual(buildDateFilters(mockDateFilters))
    })

    it('не має власного filteredValue, поки фільтр monthService не застосовано', () => {
      const column = getMonthServiceColumn(monthServiceParams)

      expect(column?.filteredValue).toBeNull()
    })

    it('відображає застосований фільтр monthService незалежно від invoiceCreationDate', () => {
      const column = getMonthServiceColumn({
        ...monthServiceParams,
        filters: {
          invoiceCreationDate: ['2025-month-1'],
          monthService: ['2026-month-1'],
        },
      })

      expect(column?.filteredValue).toEqual(['2026-month-1'])
    })

    it('приховує фільтр колонки для окремого домену (sepDomainID)', () => {
      const column = getMonthServiceColumn({
        ...monthServiceParams,
        sepDomainID: 'domain-1',
      })

      expect(column?.filters).toEqual([])
    })
  })
})
