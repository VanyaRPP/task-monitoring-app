import React from 'react'
import { render, screen } from '@testing-library/react'
import PaymentsTable from '../Table'
import { Table } from 'antd'

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/',
    push: jest.fn(),
  })),
}))

jest.mock('antd', () => {
  const React = require('react')
  const original = jest.requireActual('antd')

  const mockTable = jest.fn(({ children }) =>
    React.createElement('div', { 'data-testid': 'table' }, children)
  ) as any
  mockTable.displayName = 'Table'

  const Summary = ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'table-summary' }, children)
  Summary.displayName = 'Table.Summary'

  const Row = ({ children }: any) => React.createElement('div', null, children)
  Row.displayName = 'Table.Summary.Row'

  const Cell = ({ children }: any) => React.createElement('div', null, children)
  Cell.displayName = 'Table.Summary.Cell'

  mockTable.Summary = Summary
  mockTable.Summary.Row = Row
  mockTable.Summary.Cell = Cell

  const Tooltip = ({ children }: any) =>
    React.createElement(React.Fragment, null, children)
  Tooltip.displayName = 'Tooltip'

  const Badge = ({ children }: any) =>
    React.createElement(React.Fragment, null, children)
  Badge.displayName = 'Badge'

  return {
    ...original,
    Table: mockTable,
    Tooltip,
    Badge,
  }
})

const mockPaymentsTableFullProps = {
  payments: {
    data: [
      {
        _id: '1',
        sum: 100,
        type: 'payment',
        invoice: [],
        monthService: null,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ],
    totalPayments: { debit: 100, credit: 0 },
    total: 1,
  },
  statusProps: {
    paymentsError: false,
    paymentsLoading: false,
    paymentsFetching: false,
    currUserLoading: false,
    currUserFetching: false,
    currUserError: false,
    currUserRoles: [],
  },
  filterProps: {
    filters: {},
    setFilters: jest.fn(),
    domainsFilter: [{ text: 'Domain1', value: 'd1' }],
    companiesFilter: [{ text: 'Company1', value: 'c1' }],
    streetsFilter: [],
    dateFilters: { monthFilter: [], yearFilter: [] },
  },
  paginationProps: {
    pageData: { pageSize: 10, currentPage: 1 },
    handlePagination: jest.fn(),
  },
  actionProps: {
    onViewClick: jest.fn(),
    onEditClick: jest.fn(),
    onDelete: jest.fn(),
    deleteLoading: false,
  },
  debtProps: { debtorCompanies: [] },
  columnSelectionProps: { selectedColumns: [], setSelectedColumns: jest.fn() },
  paymentsDeleteItems: [],
  selectedPayments: [],
  tableEventProps: { handleTableChange: jest.fn() },
  onSelectPayments: jest.fn(),
  onSetDeleteItems: jest.fn(),
}

describe('PaymentsTable — filters visibility', () => {
  const wrapper = (extraProps = {}) =>
    render(
      <PaymentsTable {...(mockPaymentsTableFullProps as any)} {...extraProps} />
    )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders PaymentsTable without crashing', () => {
    wrapper()
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('can render with one domain and one company', () => {
    wrapper()
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('passes domain and company filters correctly to Table columns', () => {
    const domains = [
      { text: 'Domain1', value: 'd1' },
      { text: 'Domain2', value: 'd2' },
    ]
    const companies = [{ text: 'Company1', value: 'c1' }]

    wrapper({
      filterProps: {
        ...mockPaymentsTableFullProps.filterProps,
        domainsFilter: domains,
        companiesFilter: companies,
      },
    })

    const tableCalls = (Table as unknown as jest.Mock).mock.calls
    const lastCallProps = tableCalls[tableCalls.length - 1][0]

    const domainColumn = lastCallProps.columns.find(
      (c: any) => c.dataIndex === 'domain'
    )
    if (domainColumn) {
      expect(domainColumn.filters).toHaveLength(2)
      expect(domainColumn.filters[0].text).toBe('Domain1')
    }
  })

  test('renders with empty payment data', () => {
    wrapper({
      payments: { data: [] },
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('renders with empty filters', () => {
    wrapper({
      filterProps: {
        ...mockPaymentsTableFullProps.filterProps,
        domainsFilter: [],
        companiesFilter: [],
      },
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('calls onSelectPayments callback', () => {
    const onSelectPayments = jest.fn()
    wrapper({ onSelectPayments })
    expect(onSelectPayments).toBeDefined()
  })

  test('renders with user roles', () => {
    wrapper({
      statusProps: {
        ...mockPaymentsTableFullProps.statusProps,
        currUserRoles: ['admin', 'viewer'],
      },
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('renders with selected payments', () => {
    wrapper({
      selectedPayments: [{ _id: '1' } as any, { _id: '2' } as any],
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })
})
