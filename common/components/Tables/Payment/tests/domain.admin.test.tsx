import React from 'react'
import { render, screen } from '@testing-library/react'
import PaymentsTable from '../Table'
import { Roles } from '@utils/constants'

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/payment',
  }),
}))

jest.mock('antd', () => {
  const original = jest.requireActual('antd')
  
  const MockTable: any = ({ columns, summary, ...props }: any) => {
    const summaryContent = summary ? summary() : null
    
    return (
      <div data-testid="table">
        {columns?.map((col: any, index: number) => (
          <div key={col.key || col.dataIndex || index} data-testid={`column-${col.title}`}>
            {col.title}
          </div>
        ))}
        {summaryContent && <div data-testid="table-summary">{summaryContent}</div>}
      </div>
    )
  }

  MockTable.Summary = ({ children }: any) => <div data-testid="summary">{children}</div>
  MockTable.Summary.Row = ({ children }: any) => <div data-testid="summary-row">{children}</div>
  MockTable.Summary.Cell = ({ children, ...props }: any) => (
    <div data-testid="summary-cell">{children}</div>
  )

  return {
    ...original,
    Table: MockTable,
    Tooltip: ({ children }: any) => <>{children}</>,
    Badge: ({ children }: any) => <>{children}</>,
    Button: ({ children }: any) => <>{children}</>,
    Grid: {
      useBreakpoint: () => ({}),
    },
  }
})

const mockPaymentsTableFullProps = {
  payments: {
    data: [
      {
        _id: '1',
        domain: { _id: 'd1', name: 'Domain 1' },
        company: { _id: 'c1', companyName: 'Company 1' },
        invoice: [],
        invoiceCreationDate: '2025-01-01',
        type: 'Debit',
        generalSum: 100,
      },
    ],
    total: 1,
    totalPayments: {},
  },
  statusProps: {
    paymentsError: false,
    paymentsLoading: false,
    paymentsFetching: false,
    currUserLoading: false,
    currUserFetching: false,
    currUserError: false,
    currUserRoles: [Roles.DOMAIN_ADMIN],
  },
  filterProps: {
    filters: { domain: ['d1'] },
    setFilters: jest.fn(),
    domainsFilter: [{ text: 'Domain 1', value: 'd1' }],
    companiesFilter: [],
    streetsFilter: [],
  },
  paginationProps: {
    pageData: { currentPage: 1, pageSize: 10 },
    handlePagination: jest.fn(),
  },
  actionProps: {
    onViewClick: jest.fn(),
    onEditClick: jest.fn(),
    onDelete: jest.fn(),
    deleteLoading: false,
  },
  debtProps: {
    debtorCompanies: [],
  },
  columnSelectionProps: {
    selectedColumns: [],
    setSelectedColumns: jest.fn(),
  },
  paymentsDeleteItems: [],
  selectedPayments: [],
  onSelectPayments: jest.fn(),
  onSetDeleteItems: jest.fn(),
  tableEventProps: {
    handleTableChange: jest.fn(),
  },
}

describe('PaymentsTable — DOMAIN_ADMIN domain filtering', () => {
  const wrapper = (extraProps = {}) =>
    render(<PaymentsTable {...mockPaymentsTableFullProps as any} {...extraProps} />)

  test('hides domain column when DOMAIN_ADMIN has only one domain', () => {
    wrapper()

    expect(screen.queryByText('Надавач послуг')).not.toBeInTheDocument()
  })

  test('shows domain column when DOMAIN_ADMIN has multiple domains in data', () => {
    wrapper({
      payments: {
        ...mockPaymentsTableFullProps.payments,
        data: [
          ...mockPaymentsTableFullProps.payments.data,
          {
            _id: '2',
            domain: { _id: 'd2', name: 'Domain 2' },
            company: { _id: 'c2', companyName: 'Company 2' },
            invoice: [],
            invoiceCreationDate: '2025-01-02',
            type: 'Debit',
            generalSum: 200,
          },
        ],
      },
      filterProps: {
        ...mockPaymentsTableFullProps.filterProps,
        filters: { domain: ['d1', 'd2'] },
        domainsFilter: [
          { text: 'Domain 1', value: 'd1' },
          { text: 'Domain 2', value: 'd2' },
        ],
      },
    })

    expect(screen.getByText('Надавач послуг')).toBeInTheDocument()
  })

  test('hides domain column when all payments from same domain', () => {
    wrapper({
      payments: {
        ...mockPaymentsTableFullProps.payments,
        data: [
          {
            _id: '1',
            domain: { _id: 'd1', name: 'Domain 1' },
            company: { _id: 'c1', companyName: 'Company 1' },
            invoice: [],
            invoiceCreationDate: '2025-01-01',
            type: 'Debit',
            generalSum: 100,
          },
          {
            _id: '2',
            domain: { _id: 'd1', name: 'Domain 1' },
            company: { _id: 'c2', companyName: 'Company 2' },
            invoice: [],
            invoiceCreationDate: '2025-01-02',
            type: 'Debit',
            generalSum: 200,
          },
        ],
      },
    })

    expect(screen.queryByText('Надавач послуг')).not.toBeInTheDocument()
  })

  test('renders PaymentsTable without crashing for DOMAIN_ADMIN', () => {
    wrapper()
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('renders with empty payment data for DOMAIN_ADMIN', () => {
    wrapper({
      payments: {
        data: [],
        total: 0,
        totalPayments: {},
      },
    })

    expect(screen.getByTestId('table')).toBeInTheDocument()
  })
})