import { render, screen } from '@testing-library/react'
import InvoiceSnapshotView from './InvoiceSnapshotView'

const snapshot = {
  invoiceNumber: 123,
  invoiceCreationDate: new Date('2025-02-01'),
  type: 'credit',
  currency: 'USD',
  generalSum: 620,
  provider: { description: 'Provider X' },
  reciever: { companyName: 'Company Y' },
  invoice: [
    { name: 'Опалення', amount: 1, price: 500, sum: 500 },
    { name: 'Вода', amount: 3, price: 40, sum: 120 },
  ],
}

describe('InvoiceSnapshotView', () => {
  it('renders line items, type tag and total with the currency symbol', () => {
    const { container } = render(<InvoiceSnapshotView snapshot={snapshot} />)

    expect(screen.getByText('Опалення')).toBeInTheDocument()
    expect(screen.getByText('Вода')).toBeInTheDocument()
    expect(screen.getByText('Кредит')).toBeInTheDocument()
    expect(screen.getByText('Provider X')).toBeInTheDocument()
    expect(screen.getByText('Company Y')).toBeInTheDocument()

    expect(container.textContent).toContain('620')
    expect(container.textContent).toContain('$')
  })

  it('defaults the currency symbol to ₴ when not provided', () => {
    const { container } = render(
      <InvoiceSnapshotView snapshot={{ ...snapshot, currency: undefined }} />
    )
    expect(container.textContent).toContain('₴')
  })

  it('shows a placeholder when there is no snapshot', () => {
    render(<InvoiceSnapshotView snapshot={null} />)
    expect(screen.getByText('Немає даних')).toBeInTheDocument()
  })

  it('shows an empty state when there are no line items', () => {
    render(<InvoiceSnapshotView snapshot={{ ...snapshot, invoice: [] }} />)
    expect(screen.getByText('Немає позицій')).toBeInTheDocument()
  })
})
