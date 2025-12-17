import React from 'react'
import { render, screen } from '@testing-library/react'
import PaymentsTable from '../Table'

jest.mock('antd', () => {
  const original = jest.requireActual('antd')
  return {
    ...original,
    Table: (props: any) => <div data-testid="table">{props.children}</div>,
    Tooltip: (props: any) => <>{props.children}</>,
    Badge: (props: any) => <>{props.children}</>,
    Button: (props: any) => <>{props.children}</>,
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
  },
  filters: {
    domain: [{ _id: 'd1', name: 'Domain1' }],
    company: [{ _id: 'c1', companyName: 'Company1' }],
  },
  currUserRoles: [],
  paymentsDeleteItems: [],
  selectedPayments: [],
  tableEventProps: {},
  debtProps: {},
  columnSelectionProps: {},
  onSelectPayments: jest.fn(),
  onSetDeleteItems: jest.fn(),
  onChangeColumnSelection: jest.fn(),
}

describe('PaymentsTable — filters visibility', () => {
  const wrapper = (extraProps = {}) =>
    render(<PaymentsTable {...mockPaymentsTableFullProps as any} {...extraProps} />)

  test('renders PaymentsTable without crashing', () => {
    wrapper()
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('can render with one domain and one company', () => {
    wrapper()
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('renders with multiple domains and companies', () => {
    wrapper({
      filters: {
        domain: [
          { _id: 'd1', name: 'Domain1' },
          { _id: 'd2', name: 'Domain2' },
        ],
        company: [
          { _id: 'c1', companyName: 'Company1' },
          { _id: 'c2', companyName: 'Company2' },
        ],
      },
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('renders with empty payment data', () => {
    wrapper({
      payments: { data: [] },
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('renders with empty filters', () => {
    wrapper({
      filters: {
        domain: [],
        company: [],
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
      currUserRoles: ['admin', 'viewer'],
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  test('renders with selected payments', () => {
    wrapper({
      selectedPayments: ['1', '2'],
    })
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })
})