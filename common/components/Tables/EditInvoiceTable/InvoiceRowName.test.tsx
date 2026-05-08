import '@testing-library/jest-dom'
import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { ServiceType } from '@utils/constants'
import InvoiceRowName from './InvoiceRowName'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    company: {},
    service: { date: new Date('2026-03-15') },
    prevService: null,
    prevPayment: null,
  }),
}))

// UpdateInvoiceButton has heavy dependencies (paymentContext, RTK query side
// effects via @utils/getInvoices). For Name-component visual tests we only
// care about layout, so stub it out and re-test the button's full behavior in
// UpdateInvoiceButton.test.tsx.
jest.mock('./UpdateInvoiceButton', () => ({
  __esModule: true,
  default: ({ serviceType }: { serviceType: string }) => (
    <button type="button" data-testid="update-btn" data-service={serviceType}>
      refresh
    </button>
  ),
}))

const baseProps = {
  form: {} as any,
  name: 0,
  serviceType: ServiceType.Maintenance,
}

describe('<InvoiceRowName>', () => {
  it('renders the label', () => {
    render(<InvoiceRowName {...baseProps} label="Утримання" />)
    expect(screen.queryByText('Утримання')).not.toBeNull()
  })

  it('falls back to the service date as subtitle when none is provided', () => {
    render(<InvoiceRowName {...baseProps} label="Утримання" />)
    // formatted via dateToMonthYear/toFirstUpperCase — assert non-empty
    // *secondary* line is rendered (not equal to the label).
    const all = screen.getAllByText(/.+/)
    expect(all.length).toBeGreaterThan(1)
  })

  it('uses the override subtitle when provided', () => {
    render(
      <InvoiceRowName
        {...baseProps}
        label="Інфляція"
        subtitle="Лютий 2026"
      />
    )
    expect(screen.queryByText('Лютий 2026')).not.toBeNull()
  })

  it('renders the optional middle line', () => {
    render(
      <InvoiceRowName
        {...baseProps}
        label="Розміщення"
        middle="(без врах. інд. інф.)"
      />
    )
    expect(screen.queryByText('(без врах. інд. інф.)')).not.toBeNull()
  })

  it('omits the middle line when no middle prop is provided', () => {
    render(<InvoiceRowName {...baseProps} label="Знижка" />)
    expect(screen.queryByText(/\(.*\)/)).toBeNull()
  })

  it('hides UpdateInvoiceButton when not editable', () => {
    render(<InvoiceRowName {...baseProps} label="Утримання" />)
    expect(screen.queryByTestId('update-btn')).toBeNull()
  })

  it('renders UpdateInvoiceButton with the given serviceType when editable', () => {
    render(
      <InvoiceRowName
        {...baseProps}
        label="Утримання"
        editable
        serviceType={ServiceType.Maintenance}
      />
    )
    const btn = screen.getByTestId('update-btn')
    expect(btn.getAttribute('data-service')).toBe(ServiceType.Maintenance)
  })
})
