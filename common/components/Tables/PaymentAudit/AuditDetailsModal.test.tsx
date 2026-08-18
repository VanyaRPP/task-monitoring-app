import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AuditDetailsModal from './AuditDetailsModal'

const restoreMock = jest.fn()
jest.mock('@common/api/paymentApi/payment.api', () => ({
  useRestorePaymentMutation: () => [restoreMock, { isLoading: false }],
}))

jest.mock('./InvoiceReceiptView', () => ({
  __esModule: true,
  default: ({ snapshot }: any) => (
    <div data-testid="receipt">{snapshot?.generalSum}</div>
  ),
}))

const baseSnapshot = (sum: number) => ({
  invoiceNumber: 1,
  invoiceCreationDate: new Date('2025-02-01'),
  type: 'debit',
  currency: 'UAH',
  generalSum: sum,
  provider: { description: 'p' },
  reciever: { companyName: 'c' },
  invoice: [
    { type: 'maintenancePrice', name: 'Опалення', amount: 1, price: sum, sum },
  ],
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

const diffButton = () => screen.getByRole('button', { name: /зміни/ })

const painted = () => document.querySelectorAll('[data-audit-diff]')

const flushPaint = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
}

describe('AuditDetailsModal', () => {
  it('shows the Перегляд/JSON toggle with side-by-side До/Після and a restore button', () => {
    render(<AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />)

    expect(screen.getByText('Перегляд')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()

    expect(screen.getByText('До')).toBeInTheDocument()
    expect(screen.getByText('Після')).toBeInTheDocument()

    expect(screen.getByText('Відновити рахунок')).toBeInTheDocument()
  })

  it('a CREATE record shows both До and Після (До empty) and no restore button', () => {
    const createRecord: any = {
      ...updateRecord,
      actionType: 'CREATE',
      before: undefined,
    }
    render(<AuditDetailsModal open record={createRecord} onClose={jest.fn()} />)

    expect(screen.getByText('До')).toBeInTheDocument()
    expect(screen.getByText('Після')).toBeInTheDocument()
    expect(screen.queryByText('Відновити рахунок')).not.toBeInTheDocument()
  })

  it('offers the diff toggle for UPDATE logs with both states', () => {
    const { rerender } = render(
      <AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />
    )
    expect(diffButton()).toBeInTheDocument()

    const createRecord: any = {
      ...updateRecord,
      _id: 'log-create',
      actionType: 'CREATE',
      before: undefined,
    }
    rerender(
      <AuditDetailsModal open record={createRecord} onClose={jest.fn()} />
    )
    expect(
      screen.queryByRole('button', { name: /зміни/ })
    ).not.toBeInTheDocument()

    const deleteRecord: any = {
      ...updateRecord,
      _id: 'log-delete',
      actionType: 'DELETE',
      after: undefined,
    }
    rerender(
      <AuditDetailsModal open record={deleteRecord} onClose={jest.fn()} />
    )
    expect(
      screen.queryByRole('button', { name: /зміни/ })
    ).not.toBeInTheDocument()
  })

  it('keeps the receipt layout in Перегляд whether the diff is on or off', () => {
    render(<AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />)

    expect(screen.getAllByTestId('receipt')).toHaveLength(2)

    fireEvent.click(diffButton())

    expect(screen.getAllByTestId('receipt')).toHaveLength(2)
    expect(screen.getByText('До')).toBeInTheDocument()
    expect(screen.getByText('Після')).toBeInTheDocument()
  })

  it('highlights the preview when both sides use the same template', async () => {
    render(<AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />)
    fireEvent.click(diffButton())

    await waitFor(() => expect(painted()).toHaveLength(2))
  })

  it('skips preview highlighting when the template changed', async () => {
    const templateSwitch: any = {
      ...updateRecord,
      _id: 'log-template',
      before: { ...baseSnapshot(500), template: 'classic' },
      after: { ...baseSnapshot(600), template: 'ledger' },
    }
    render(
      <AuditDetailsModal open record={templateSwitch} onClose={jest.fn()} />
    )
    fireEvent.click(diffButton())

    await flushPaint()
    expect(painted()).toHaveLength(0)
    expect(screen.getAllByTestId('receipt')).toHaveLength(2)
  })

  it('prints the JSON tab as one block until the diff is turned on', () => {
    render(<AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />)
    fireEvent.click(screen.getByText('JSON'))

    const [beforePre] = document.querySelectorAll('pre')
    expect(beforePre.textContent).toContain('"generalSum": 500')
    expect(beforePre.querySelectorAll('div')).toHaveLength(0)
  })

  it('shows an aligned JSON diff with -/+ markers when the diff is on', () => {
    render(<AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />)
    fireEvent.click(diffButton())
    fireEvent.click(screen.getByText('JSON'))

    const [beforePre, afterPre] = Array.from(document.querySelectorAll('pre'))

    const diffLines = (pre: Element) =>
      Array.from(pre.querySelectorAll<HTMLElement>(':scope > div')).map(
        (line) => ({
          marker: line.querySelector('span')?.textContent?.trim() ?? '',
          text: (line.textContent ?? '').replace(/\s+/g, ' ').trim(),
          painted: !!line.style.background,
        })
      )

    const before = diffLines(beforePre)
    const after = diffLines(afterPre)

    expect(before).toHaveLength(after.length)

    const removed = before.filter((line) => line.marker === '-')
    const added = after.filter((line) => line.marker === '+')

    expect(removed.map((line) => line.text)).toEqual([
      '- "generalSum": 500,',
      '- "price": 500,',
      '- "sum": 500',
    ])
    expect(added.map((line) => line.text)).toEqual([
      '+ "generalSum": 600,',
      '+ "price": 600,',
      '+ "sum": 600',
    ])

    expect(removed.every((line) => line.painted)).toBe(true)
    expect(added.every((line) => line.painted)).toBe(true)

    expect(
      before.filter((line) => line.marker === '' && line.text !== '')
    ).not.toHaveLength(0)
    expect(
      before.filter(
        (line) => line.marker === '' && line.text !== '' && line.painted
      )
    ).toEqual([])

    expect(before.filter((line) => line.marker === '+')).toEqual([])
    expect(after.filter((line) => line.marker === '-')).toEqual([])
  })

  it('faces an added field with a spacer on the other side', () => {
    const withExtraField: any = {
      ...updateRecord,
      _id: 'log-added-field',
      after: { ...baseSnapshot(500), description: 'Новий опис' },
    }
    render(
      <AuditDetailsModal open record={withExtraField} onClose={jest.fn()} />
    )
    fireEvent.click(diffButton())
    fireEvent.click(screen.getByText('JSON'))

    const [beforePre, afterPre] = Array.from(document.querySelectorAll('pre'))
    const rows = (pre: Element) =>
      Array.from(pre.querySelectorAll<HTMLElement>(':scope > div'))

    const addedIndex = rows(afterPre).findIndex((line) =>
      line.textContent?.includes('Новий опис')
    )
    expect(addedIndex).toBeGreaterThanOrEqual(0)
    expect(
      rows(afterPre)[addedIndex].querySelector('span')?.textContent?.trim()
    ).toBe('+')

    const facing = rows(beforePre)[addedIndex]
    expect(facing.textContent?.trim()).toBe('')
    expect(facing.style.background).toBeTruthy()
  })

  it('resets the tab and the diff toggle when another record is opened', () => {
    const { rerender } = render(
      <AuditDetailsModal open record={updateRecord} onClose={jest.fn()} />
    )
    fireEvent.click(diffButton())
    expect(diffButton()).toHaveTextContent('Сховати зміни')

    rerender(
      <AuditDetailsModal
        open
        record={{ ...updateRecord, _id: 'log2' }}
        onClose={jest.fn()}
      />
    )

    expect(screen.getAllByTestId('receipt')).toHaveLength(2)
    expect(diffButton()).toHaveTextContent('Показати зміни')
  })
})
