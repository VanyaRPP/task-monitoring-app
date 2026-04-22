import React from 'react'
import { render } from '@testing-library/react'
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

  const Tooltip = ({ children }: any) => React.createElement(React.Fragment, null, children)
  Tooltip.displayName = 'Tooltip'
  const Badge = ({ children }: any) => React.createElement(React.Fragment, null, children)
  Badge.displayName = 'Badge'

  return { ...original, Table: mockTable, Tooltip, Badge }
})

const baseProps = {
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
    domainsFilter: [],
    companiesFilter: [],
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

const SAME_DATE = '2026-04-21T00:00:00.000Z'

const debitPayment = {
  _id: '69e7a775e28ea37cafe9ece6',
  invoiceNumber: 1083,
  type: 'debit',
  invoiceCreationDate: SAME_DATE,
  invoice: [],
  generalSum: 5500,
}

const creditPayment = {
  _id: '69e8d9348766b6b78e5e7d16',
  invoiceNumber: 1087,
  type: 'credit',
  invoiceCreationDate: SAME_DATE,
  invoice: [],
  generalSum: 5500,
}

const olderDebitPayment = {
  _id: '69e7a659e28ea37cafe9ec47',
  invoiceNumber: 1082,
  type: 'debit',
  invoiceCreationDate: '2026-04-02T00:00:00.000Z',
  invoice: [],
  generalSum: 4452.3,
}

function getDataSource() {
  const calls = (Table as unknown as jest.Mock).mock.calls
  return calls[calls.length - 1][0].dataSource
}

describe('PaymentsTable — sorting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('credit appears before debit when dates are equal', () => {
    render(
      <PaymentsTable
        {...(baseProps as any)}
        payments={{
          data: [debitPayment, creditPayment],
          totalPayments: { debit: 5500, credit: 5500 },
          total: 2,
        }}
      />
    )

    const dataSource = getDataSource()
    expect(dataSource[0].type).toBe('credit')
    expect(dataSource[1].type).toBe('debit')
  })

  test('newer payment appears before older regardless of type', () => {
    render(
      <PaymentsTable
        {...(baseProps as any)}
        payments={{
          data: [olderDebitPayment, creditPayment],
          totalPayments: { debit: 4452.3, credit: 5500 },
          total: 2,
        }}
      />
    )

    const dataSource = getDataSource()
    expect(dataSource[0]._id).toBe(creditPayment._id)
    expect(dataSource[1]._id).toBe(olderDebitPayment._id)
  })

  test('full case: credit Apr 21 → debit Apr 21 → debit Apr 02', () => {
    render(
      <PaymentsTable
        {...(baseProps as any)}
        payments={{
          data: [debitPayment, creditPayment, olderDebitPayment],
          totalPayments: { debit: 9952.3, credit: 5500 },
          total: 3,
        }}
      />
    )

    const dataSource = getDataSource()
    expect(dataSource[0]._id).toBe(creditPayment._id)
    expect(dataSource[1]._id).toBe(debitPayment._id)
    expect(dataSource[2]._id).toBe(olderDebitPayment._id)
  })
})
