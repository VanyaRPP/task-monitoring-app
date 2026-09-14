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
