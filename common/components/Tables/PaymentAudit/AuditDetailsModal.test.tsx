import { render, screen } from '@testing-library/react'
import AuditDetailsModal from './AuditDetailsModal'

const restoreMock = jest.fn()
jest.mock('@common/api/paymentApi/payment.api', () => ({
  useRestorePaymentMutation: () => [restoreMock, { isLoading: false }],
}))

jest.mock('./InvoiceReceiptView', () => ({
  __esModule: true,
  default: () => <div data-testid="receipt" />,
}))

const baseSnapshot = (sum: number) => ({
  invoiceNumber: 1,
  invoiceCreationDate: new Date('2025-02-01'),
  type: 'debit',
  currency: 'UAH',
  generalSum: sum,
  provider: { description: 'p' },
  reciever: { companyName: 'c' },
  invoice: [{ name: 'Опалення', amount: 1, price: sum, sum }],
})

const updateRecord: any = {
  _id: 'log1',
  actionType: 'UPDATE',
  actorEmail: 'a@b.com',
  date: '2025-02-01',
  before: baseSnapshot(500),
  after: baseSnapshot(600),
  invoiceData: baseSnapshot(600),
}

describe('AuditDetailsModal', () => {
  it('shows the Перегляд/JSON toggle with side-by-side До/Після and a restore button', () => {
    render(
      <AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />
    )

    expect(screen.getByText('Перегляд')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()

    expect(screen.getByText('До')).toBeInTheDocument()
    expect(screen.getByText('Після')).toBeInTheDocument()

    expect(screen.getByText('Відновити рахунок')).toBeInTheDocument()
  })

  it('a CREATE record shows only Після and no restore button', () => {
    const createRecord: any = {
      ...updateRecord,
      actionType: 'CREATE',
      before: undefined,
    }
    render(
      <AuditDetailsModal open record={createRecord} onClose={jest.fn()} />
    )

    expect(screen.queryByText('До')).not.toBeInTheDocument()
    expect(screen.getByText('Після')).toBeInTheDocument()
    expect(screen.queryByText('Відновити рахунок')).not.toBeInTheDocument()
  })
})
