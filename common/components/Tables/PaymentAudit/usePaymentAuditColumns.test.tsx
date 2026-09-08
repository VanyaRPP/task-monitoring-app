import React from 'react'
import { render, screen } from '@testing-library/react'
import { usePaymentAuditColumns } from './usePaymentAuditColumns'
import { IPaymentChangeLog } from '@common/api/paymentApi/payment.api.types'

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
        'div',
        { 'data-testid': 'tooltip' },
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

const findColumn = (columns: any[], key: string) =>
  columns.find((column) => column.key === key)

const Harness: React.FC<{
  columnKey: string
  record: Partial<IPaymentChangeLog>
}> = ({ columnKey, record }) => {
  const columns = usePaymentAuditColumns({
    filters: {},
    onOpenDetails: jest.fn(),
    domainOptions: [],
    companyOptions: [],
  })
  const column = findColumn(columns as any[], columnKey)
  return <>{(column as any).render(undefined, record)}</>
}

describe('usePaymentAuditColumns name truncation', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('shows a short domain name in full with no tooltip', () => {
    setWidths(50, 50)
    render(
      <Harness columnKey="domainId" record={{ domainName: 'kys' } as any} />
    )
    expect(screen.getByText('kys')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })

  it('truncates a long domain name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName =
      'Дуже довга назва домену, яка точно не поміщається у колонку'
    render(
      <Harness columnKey="domainId" record={{ domainName: longName } as any} />
    )
    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })

  it('shows "Не знайдено" when the domain name is missing', () => {
    setWidths(50, 50)
    render(<Harness columnKey="domainId" record={{} as any} />)
    expect(screen.getByText('Не знайдено')).toBeInTheDocument()
  })

  it('truncates a long company name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    render(
      <Harness columnKey="company" record={{ companyName: longName } as any} />
    )
    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })

  it('shows a short company name in full with no tooltip', () => {
    setWidths(50, 50)
    render(
      <Harness columnKey="company" record={{ companyName: 'Google' } as any} />
    )
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })
})
