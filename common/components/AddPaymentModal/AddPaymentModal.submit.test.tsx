import { expect } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Operations } from '@utils/constants'

const addPayment = jest.fn()
const editPayment = jest.fn()
const sendPaymentEmail = jest.fn()

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useAddPaymentMutation: () => [addPayment, { isLoading: false }],
  useEditPaymentMutation: () => [editPayment, { isLoading: false }],
  useSendPaymentEmailMutation: () => [sendPaymentEmail],
}))
jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({ data: { data: [] } }),
  useCreateCustomServiceMutation: () => [jest.fn()],
}))
jest.mock('@common/api/domainApi/domain.api', () => ({
  useAddDomainMutation: () => [jest.fn()],
  useGetDomainByPkQuery: () => ({ data: undefined }),
  useGetDomainTypeTemplatesQuery: () => ({ data: [] }),
}))
jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useAddRealEstateMutation: () => [jest.fn()],
}))
jest.mock('@common/api/changelogApi/changelog.api', () => ({
  useGetPaymentChangeLogsQuery: () => ({ data: undefined, isLoading: false }),
  useDeletePaymentChangeLogMutation: () => [jest.fn()],
}))
jest.mock('@common/api/streetApi/street.api', () => ({
  useAddStreetMutation: () => [jest.fn()],
}))
jest.mock(
  '@common/components/Forms/AddPaymentForm/useResolveMonthServiceId',
  () => ({
    useResolveMonthServiceId: () => async (monthService?: string) =>
      monthService || 'month-service-id',
  })
)
jest.mock('@modules/hooks/usePaymentData', () => ({
  usePaymentFormData: () => ({
    company: {
      _id: 'c1',
      companyName: 'Acme',
      description: 'Acme LLC',
      adminEmails: ['client@acme.com'],
      domain: { _id: 'd1', name: 'Provider', description: 'Provider LLC' },
    },
    service: null,
    prevService: null,
    prevPayment: null,
  }),
}))
jest.mock('@utils/getInvoices', () => ({ getInvoices: () => [] }))
jest.mock(
  '@components/Pages/BankTransactions/components/TransactionsTable/components/bankHelper',
  () => ({ normalizeTechnicalTransactionId: (id?: string) => id ?? '' })
)

// The form's fields, without the selects and the data they load: enough for
// the modal to validate, build the payload and save.
jest.mock('@components/Forms/AddPaymentForm', () => {
  const { Form: AntForm } = jest.requireActual('antd')
  const Fields = () => (
    <>
      <AntForm.Item name="domain">
        <input aria-label="domain" />
      </AntForm.Item>
      <AntForm.Item
        name="company"
        rules={[{ required: true, message: 'company is required' }]}
      >
        <input aria-label="company" />
      </AntForm.Item>
      <AntForm.Item name="monthService">
        <input aria-label="month" />
      </AntForm.Item>
      <AntForm.Item name="operation">
        <input aria-label="operation" />
      </AntForm.Item>
    </>
  )
  return { __esModule: true, default: Fields }
})
jest.mock('@components/AddPaymentModal/InvoiceTour', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/AddPaymentModal/InvoiceTemplateTab', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/AddPaymentModal/LiveDocuments', () => ({
  LiveInvoice: () => <div>live invoice</div>,
  LivePriceList: () => null,
  LiveReceipt: () => null,
  SideInvoicePreview: () => null,
}))
jest.mock('@components/Forms/AddPaymentForm/PriceList', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/Forms/GroupedReceiptForm', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/Forms/PaymentReceiptForm', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/Forms/ReceiptForm', () => ({
  __esModule: true,
  default: () => null,
}))
// Draws nothing; hands over the "rendered" invoice straight away, and exposes
// which payment it was asked to draw.
jest.mock(
  '@components/Forms/GroupedReceiptForm/HeadlessReceiptRenderer',
  () => {
    const React = jest.requireActual('react')
    const Renderer = ({
      payment,
      onCapture,
    }: {
      payment: { _id: string }
      onCapture: (html: string) => void
    }) => {
      React.useEffect(() => {
        onCapture(`<html>invoice ${payment._id}</html>`)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return null
    }
    return { __esModule: true, default: Renderer }
  }
)

import AddPaymentModal from '@components/AddPaymentModal'

class FakeBroadcastChannel {
  postMessage = jest.fn()
  close = jest.fn()
}
Object.defineProperty(global, 'BroadcastChannel', {
  writable: true,
  value: FakeBroadcastChannel,
})

const savedInvoice = { _id: 'new-invoice', invoiceNumber: 7 }

const renderModal = (props: Record<string, unknown> = {}) => {
  const closeModal = jest.fn()
  render(
    <AddPaymentModal
      closeModal={closeModal}
      paymentActions={{ edit: false, preview: false }}
      preselectedDomain="d1"
      preselectedCompany="c1"
      {...props}
    />
  )
  return { closeModal }
}

const saveButton = () => screen.getByRole('button', { name: 'Додати' })
const saveAndSendButton = () =>
  screen.getByRole('button', { name: 'Додати й надіслати' })

beforeEach(() => {
  jest.clearAllMocks()
  addPayment.mockResolvedValue({ data: { success: true, data: savedInvoice } })
  editPayment.mockResolvedValue({ data: { success: true } })
  sendPaymentEmail.mockReturnValue({
    unwrap: () => Promise.resolve({ success: true }),
  })
})

describe('AddPaymentModal — збереження', () => {
  // The first «Додати» used to only open the preview; saving took a second
  // press of the same button.
  it('перше ж натискання «Додати» зберігає рахунок і закриває форму', async () => {
    const user = userEvent.setup()
    const { closeModal } = renderModal()

    await user.click(saveButton())

    await waitFor(() => expect(closeModal).toHaveBeenCalledWith(true))
    expect(addPayment).toHaveBeenCalledTimes(1)
    expect(addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'd1',
        company: 'c1',
        type: Operations.Debit,
        monthService: 'month-service-id',
        reciever: expect.objectContaining({ companyName: 'Acme' }),
      })
    )
    expect(sendPaymentEmail).not.toHaveBeenCalled()
  })

  it('не зберігає й не закриває форму, поки не обрано компанію', async () => {
    const user = userEvent.setup()
    const { closeModal } = renderModal({ preselectedCompany: undefined })

    await user.click(saveButton())

    expect(await screen.findByText('company is required')).toBeInTheDocument()
    expect(addPayment).not.toHaveBeenCalled()
    expect(closeModal).not.toHaveBeenCalled()
  })

  it('лишає форму відкритою, якщо сервер не зберіг рахунок', async () => {
    addPayment.mockResolvedValue({ error: { status: 400 } })
    const user = userEvent.setup()
    const { closeModal } = renderModal()

    await user.click(saveButton())

    expect(
      await screen.findByText('Помилка при додаванні рахунку')
    ).toBeInTheDocument()
    expect(closeModal).not.toHaveBeenCalled()
  })
})

describe('AddPaymentModal — зберегти й надіслати', () => {
  it('питає підтвердження і показує, кому піде рахунок', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(saveAndSendButton())

    expect(
      await screen.findByText('Отримувачі: client@acme.com')
    ).toBeInTheDocument()
    expect(addPayment).not.toHaveBeenCalled()
  })

  it('зберігає рахунок і надсилає саме його, вже з номером від сервера', async () => {
    const user = userEvent.setup()
    const { closeModal } = renderModal()

    await user.click(saveAndSendButton())
    await user.click(await screen.findByRole('button', { name: 'Надіслати' }))

    await waitFor(() => expect(closeModal).toHaveBeenCalledWith(true))
    expect(addPayment).toHaveBeenCalledTimes(1)
    expect(sendPaymentEmail).toHaveBeenCalledWith({
      id: 'new-invoice',
      html: '<html>invoice new-invoice</html>',
    })
    expect(
      await screen.findByText('Рахунок збережено й надіслано на пошту')
    ).toBeInTheDocument()
  })

  it('якщо лист не пішов — рахунок усе одно збережено, і про це сказано', async () => {
    sendPaymentEmail.mockReturnValue({
      unwrap: () => Promise.reject(new Error('smtp down')),
    })
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => null)
    const user = userEvent.setup()
    const { closeModal } = renderModal()

    await user.click(saveAndSendButton())
    await user.click(await screen.findByRole('button', { name: 'Надіслати' }))

    await waitFor(() => expect(closeModal).toHaveBeenCalledWith(true))
    expect(addPayment).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText(/збережено, але надіслати його не вдалося/)
    ).toBeInTheDocument()
    errorSpy.mockRestore()
  })

  it('не надсилає нічого, якщо рахунок не збережено', async () => {
    addPayment.mockResolvedValue({ error: { status: 400 } })
    const user = userEvent.setup()
    const { closeModal } = renderModal()

    await user.click(saveAndSendButton())
    await user.click(await screen.findByRole('button', { name: 'Надіслати' }))

    await screen.findByText('Помилка при додаванні рахунку')
    expect(sendPaymentEmail).not.toHaveBeenCalled()
    expect(closeModal).not.toHaveBeenCalled()
  })

  it('оплату (кредит) надіслати не пропонує', () => {
    renderModal({ initialOperation: Operations.Credit })

    expect(screen.getByText('Додавання оплати')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Додати й надіслати' })
    ).not.toBeInTheDocument()
  })

  it('уже надісланий рахунок вдруге надіслати не пропонує', () => {
    renderModal({
      paymentActions: { edit: true, preview: false },
      paymentData: {
        _id: 'p1',
        type: Operations.Debit,
        status: 'sent',
        domain: 'd1',
        company: 'c1',
        invoice: [],
      },
    })

    expect(screen.getByRole('button', { name: 'Зберегти' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Зберегти й надіслати' })
    ).not.toBeInTheDocument()
  })
})

describe('AddPaymentModal — перегляд', () => {
  // The preview used to be locked until the form had been submitted once.
  it('вкладка «Перегляд» доступна одразу, без збереження', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('tab', { name: 'Перегляд' }))

    expect(await screen.findByText('live invoice')).toBeInTheDocument()
    expect(addPayment).not.toHaveBeenCalled()
  })
})
