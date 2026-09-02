import { Operations } from '@utils/constants'
import {
  IExtendedPayment,
  PaymentStatus,
} from '@common/api/paymentApi/payment.api.types'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PaymentDropdown from '@components/PaymentDropDown'
import { Modal } from 'antd'

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  Modal: {
    ...jest.requireActual('antd').Modal,
    confirm: jest.fn(),
  },
}))

jest.mock('@assets/features/formatDate', () => ({
  dateToDefaultFormat: jest.fn(() => '01.01.2025'),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

const modalConfirmMock = Modal.confirm as jest.Mock

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
  const onUpdatePaymentStatus = jest.fn().mockResolvedValue(undefined)

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
      onUpdatePaymentStatus={onUpdatePaymentStatus}
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
    onUpdatePaymentStatus,
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

  it('sends the rendered invoice html so the email can attach a PDF', async () => {
    const { onSendPaymentEmail, onUpdatePaymentStatus } = setup()
    openDropdown()
    fireEvent.click(screen.getByText('payments.statuses.draft'))

    await waitFor(() =>
      expect(onSendPaymentEmail).toHaveBeenCalledWith(
        '1',
        '<html>captured invoice</html>'
      )
    )
    await waitFor(() =>
      expect(onUpdatePaymentStatus).toHaveBeenCalledWith({
        _id: '1',
        status: PaymentStatus.Sent,
      })
    )
  })

  it('does not resend an already-sent payment', () => {
    const { onSendPaymentEmail } = setup({ status: PaymentStatus.Sent })
    openDropdown()
    fireEvent.click(screen.getByText('payments.statuses.sent'))

    expect(onSendPaymentEmail).not.toHaveBeenCalled()
  })

  it('leaves the status untouched when sending fails', async () => {
    const { onSendPaymentEmail, onUpdatePaymentStatus } = setup()
    onSendPaymentEmail.mockResolvedValue({ success: false })
    openDropdown()
    fireEvent.click(screen.getByText('payments.statuses.draft'))

    await waitFor(() => expect(onSendPaymentEmail).toHaveBeenCalled())
    expect(onUpdatePaymentStatus).not.toHaveBeenCalled()
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
