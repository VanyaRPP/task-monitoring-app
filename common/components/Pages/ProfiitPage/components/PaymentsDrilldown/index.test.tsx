import React from 'react'
import { render, screen } from '@testing-library/react'

import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { Operations } from '@utils/constants'
import PaymentsDrilldown from './index'

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useGetAllPaymentsQuery: jest.fn(),
}))

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@components/UI/ModalWindow', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

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

describe('PaymentsDrilldown', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('truncates a long debtor company name and shows it via tooltip', () => {
    setWidths(300, 50)
    const longName =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          {
            _id: '1',
            type: 'debit',
            generalSum: 100,
            currency: 'UAH',
            company: { _id: 'c1', companyName: longName },
          },
        ],
        total: 1,
      },
      isFetching: false,
      isError: false,
    })

    render(
      <PaymentsDrilldown
        domainId="d1"
        month="2026-09"
        target="outstanding"
        currency="UAH"
        onClose={jest.fn()}
      />
    )

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })

  it('shows a short debtor company name in full with no tooltip', () => {
    setWidths(50, 50)
    ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          {
            _id: '1',
            type: 'debit',
            generalSum: 100,
            currency: 'UAH',
            company: { _id: 'c1', companyName: 'Google' },
          },
        ],
        total: 1,
      },
      isFetching: false,
      isError: false,
    })

    render(
      <PaymentsDrilldown
        domainId="d1"
        month="2026-09"
        target="outstanding"
        currency="UAH"
        onClose={jest.fn()}
      />
    )

    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })
})

const renderDrilldown = (month: string | null) =>
  render(
    <PaymentsDrilldown
      domainId="domain-1"
      month={month}
      target={Operations.Credit as any}
      currency="UAH"
      onClose={jest.fn()}
    />
  )

describe('PaymentsDrilldown — «Перейти до платежів»', () => {
  beforeEach(() => {
    ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({
      data: { data: [], total: 0 },
      isFetching: false,
      isError: false,
    })
  })

  it('веде на платежі, відфільтровані за місяцем відкритого розрахунку', () => {
    renderDrilldown('2026-07')

    expect(screen.getByRole('link', { name: /openPayments/ })).toHaveAttribute(
      'href',
      '/payment?monthService=2026-07'
    )
  })

  it('додає провідний нуль, щоб посилання завжди мало формат YYYY-MM', () => {
    renderDrilldown('2026-01')

    expect(screen.getByRole('link', { name: /openPayments/ })).toHaveAttribute(
      'href',
      '/payment?monthService=2026-01'
    )
  })

  it('веде на платежі без фільтра, коли місяць нерозпізнаний', () => {
    renderDrilldown('не місяць')

    expect(screen.getByRole('link', { name: /openPayments/ })).toHaveAttribute(
      'href',
      '/payment'
    )
  })
})
