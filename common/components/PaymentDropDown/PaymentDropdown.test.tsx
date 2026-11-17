import { Operations } from '@utils/constants'
import {
  IExtendedPayment,
  PaymentStatus,
} from '@common/api/paymentApi/payment.api.types'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import PaymentDropdown from '@components/PaymentDropDown'

const modalConfirmMock = jest.fn()

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  App: {
    ...jest.requireActual('antd').App,
    useApp: () => ({
      modal: { confirm: modalConfirmMock },
      message: jest.requireActual('antd').message,
      notification: jest.requireActual('antd').notification,
    }),
  },
}))

jest.mock('@assets/features/formatDate', () => ({
  dateToDefaultFormat: jest.fn(() => '01.01.2025'),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
  }),
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useHtmlToPdfMutation: () => [jest.fn(), { isLoading: false }],
}))

jest.mock(
  '@components/Forms/GroupedReceiptForm/HeadlessReceiptRenderer',
  () => {
    const React = jest.requireActual('react')
    const MockHeadlessReceiptRenderer = ({
      onCapture,
    }: {
      onCapture: (html: string) => void
    }) => {
      React.useEffect(() => {
        onCapture('<html>captured invoice</html>')
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return null
    }
    return { __esModule: true, default: MockHeadlessReceiptRenderer }
  }
)

const basePayment = {
  _id: '1',
  invoiceCreationDate: new Date().toISOString(),
  generalSum: 100,
  provider: {},
  reciever: {},
  transaction: {},
  domain: 'd',
  street: 's',
  company: 'c',
  monthService: 'ms',
} as unknown as IExtendedPayment

const setup = (paymentOverride = {}, isAdmin = true) => {
  const onView = jest.fn()
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  const onMarkPaid = jest.fn()
  const onDuplicate = jest.fn()
  const onSendPaymentEmail = jest.fn().mockResolvedValue({ success: true })

  render(
    <PaymentDropdown
      payment={{ ...basePayment, ...paymentOverride }}
      isAdmin={isAdmin}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onMarkPaid={onMarkPaid}
      onDuplicate={onDuplicate}
      onSendPaymentEmail={onSendPaymentEmail}
      deleteLoading={false}
    />
  )

  return {
    onView,
    onEdit,
    onDelete,
    onMarkPaid,
    onDuplicate,
    onSendPaymentEmail,
  }
}

const openDropdown = () => fireEvent.click(screen.getByRole('button'))

beforeEach(() => jest.clearAllMocks())

describe('PaymentDropdown', () => {
  it('renders and opens dropdown', () => {
    setup()
    openDropdown()

    expect(screen.getByText('Переглянути')).toBeInTheDocument()
  })

  it('calls onView', () => {
    const { onView } = setup()
    openDropdown()
    fireEvent.click(screen.getByText('Переглянути'))

    expect(onView).toHaveBeenCalled()
  })

  it('calls onEdit when admin', () => {
    const { onEdit } = setup({}, true)
    openDropdown()
    fireEvent.click(screen.getByText('Редагувати'))

    expect(onEdit).toHaveBeenCalled()
  })

  it('hides edit when not admin', () => {
    setup({}, false)
    openDropdown()

    expect(screen.queryByText('Редагувати')).not.toBeInTheDocument()
  })

  it('calls onMarkPaid for debit payment', () => {
    const { onMarkPaid } = setup({ type: Operations.Debit })
    openDropdown()
    fireEvent.click(screen.getByText('Позначити оплату'))

    expect(onMarkPaid).toHaveBeenCalled()
  })

  it('hides mark paid for credit payment', () => {
    setup({ type: Operations.Credit })
    openDropdown()

    expect(screen.queryByText('Позначити оплату')).not.toBeInTheDocument()
  })

  it('shows delete when admin', () => {
    setup({}, true)
    openDropdown()

    expect(screen.getByText('Видалити платіж')).toBeInTheDocument()
  })

  it('hides delete when not admin', () => {
    setup({}, false)
    openDropdown()

    expect(screen.queryByText('Видалити платіж')).not.toBeInTheDocument()
  })

  // The send item used to be labelled with the status ("Драфт") and emailed
  // the invoice the moment it was clicked.
  it('names the send item after the action, not the status', () => {
    setup()
    openDropdown()

    expect(screen.getByText('payments.actions.send')).toBeInTheDocument()
    expect(screen.queryByText('payments.statuses.draft')).toBeNull()
  })

  it('asks before sending and shows who the invoice goes to', () => {
    const { onSendPaymentEmail } = setup({
      invoiceNumber: 42,
      reciever: { adminEmails: ['client@real.com', 'boss@real.com'] },
    })
    openDropdown()
    fireEvent.click(screen.getByText('payments.actions.send'))

    expect(onSendPaymentEmail).not.toHaveBeenCalled()
    const confirm = modalConfirmMock.mock.calls[0][0]
    expect(confirm.title).toContain('"number":42')
    expect(confirm.content).toContain('client@real.com, boss@real.com')
  })

  it('falls back to the company emails when the invoice stores none', () => {
    setup({
      reciever: {},
      company: { adminEmails: ['owner@real.com'] },
    })
    openDropdown()
    fireEvent.click(screen.getByText('payments.actions.send'))

    expect(modalConfirmMock.mock.calls[0][0].content).toContain(
      'owner@real.com'
    )
  })

  it('says so when no recipient is known', () => {
    setup()
    openDropdown()
    fireEvent.click(screen.getByText('payments.actions.send'))

    expect(modalConfirmMock.mock.calls[0][0].content).toBe(
      'payments.confirm.noRecipients'
    )
  })

  it('sends the rendered invoice html once confirmed, so the email can attach a PDF', async () => {
    const { onSendPaymentEmail } = setup()
    openDropdown()
    fireEvent.click(screen.getByText('payments.actions.send'))
    act(() => modalConfirmMock.mock.calls[0][0].onOk())

    await waitFor(() =>
      expect(onSendPaymentEmail).toHaveBeenCalledWith(
        '1',
        '<html>captured invoice</html>'
      )
    )
    expect(
      await screen.findByText('payments.messages.sendSuccess')
    ).toBeInTheDocument()
  })

  it('does not resend an already-sent payment', () => {
    const { onSendPaymentEmail } = setup({ status: PaymentStatus.Sent })
    openDropdown()
    fireEvent.click(screen.getByText('payments.statuses.sent'))

    expect(modalConfirmMock).not.toHaveBeenCalled()
    expect(onSendPaymentEmail).not.toHaveBeenCalled()
  })

  it('reports a failed send', async () => {
    const { onSendPaymentEmail } = setup()
    onSendPaymentEmail.mockResolvedValue({ success: false })
    openDropdown()
    fireEvent.click(screen.getByText('payments.actions.send'))
    act(() => modalConfirmMock.mock.calls[0][0].onOk())

    await waitFor(() => expect(onSendPaymentEmail).toHaveBeenCalled())
    expect(
      await screen.findByText('payments.messages.sendFailed')
    ).toBeInTheDocument()
  })

  it('calls onDelete via Modal.confirm', () => {
    const { onDelete } = setup()
    openDropdown()
    fireEvent.click(screen.getByText('Видалити платіж'))

    expect(modalConfirmMock).toHaveBeenCalled()
    const { onOk } = modalConfirmMock.mock.calls[0][0]
    onOk()

    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
