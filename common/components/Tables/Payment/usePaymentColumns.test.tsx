import React from 'react'
import { render, screen } from '@testing-library/react'
import { usePaymentColumns } from './usePaymentColumns'

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
