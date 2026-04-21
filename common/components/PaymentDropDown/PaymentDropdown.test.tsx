import { Operations } from '@utils/constants'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { render, screen, fireEvent } from '@testing-library/react'
import PaymentDropdown from '@components/PaymentDropDown'

describe('handleMarkPaid', () => {
  let addPaymentMock: jest.Mock
  let messageSuccess: jest.Mock
  let messageError: jest.Mock

  const createHandler = (invoiceNumber: number) => {
    return async (source: IExtendedPayment) => {
      const monthServiceId =
        typeof source.monthService === 'string'
          ? source.monthService
          : source.monthService?._id

      const newCredit = {
        invoiceNumber,
        type: Operations.Credit,
        domain: source.domain,
        street: source.street,
        company: source.company,
        monthService: monthServiceId,
        invoiceCreationDate: expect.any(Date),
        generalSum: source.generalSum,
        provider: source.provider,
        reciever: source.reciever,
        transaction: source.transaction,
        invoice: undefined,
      }

      const response = await addPaymentMock(newCredit)

      if ('data' in response) {
        messageSuccess('Кредіт-платіж створено')
      } else {
        messageError('Не вдалося створити оплату')
      }
    }
  }

  beforeEach(() => {
    addPaymentMock = jest.fn() as unknown as jest.Mock
    messageSuccess = jest.fn()
    messageError = jest.fn()
  })

  it('should create credit payment with string monthService', async () => {
    addPaymentMock.mockResolvedValue({ data: {} } as any)

    const handler = createHandler(111)

    const source = {
      _id: '1',
      type: Operations.Debit,
      domain: 'domain1',
      street: 'street1',
      company: 'company1',
      monthService: 'ms1',
      generalSum: 100,
      provider: {},
      reciever: {},
      transaction: {},
    } as unknown as IExtendedPayment

    await handler(source)

    expect(addPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: Operations.Credit,
        monthService: 'ms1',
        invoiceNumber: 123,
      })
    )

    expect(messageSuccess).toHaveBeenCalled()
  })

  it('should extract _id from object monthService', async () => {
    addPaymentMock.mockResolvedValue({ data: {} } as any)

    const handler = createHandler(222)

    const source = {
      _id: '1',
      type: Operations.Debit,
      domain: 'domain1',
      street: 'street1',
      company: 'company1',
      monthService: { _id: 'ms-object-id' },
      generalSum: 200,
      provider: {},
      reciever: {},
      transaction: {},
    } as unknown as IExtendedPayment

    await handler(source)

    expect(addPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        monthService: 'ms-object-id',
      })
    )
  })

  it('should call error message if request failed', async () => {
    addPaymentMock.mockResolvedValue({ error: true } as any)

    const handler = createHandler(333)

    const source = {
      _id: '1',
      type: Operations.Debit,
      domain: 'domain1',
      street: 'street1',
      company: 'company1',
      monthService: 'ms1',
      generalSum: 300,
      provider: {},
      reciever: {},
      transaction: {},
    } as unknown as IExtendedPayment

    await handler(source)

    expect(messageError).toHaveBeenCalled()
  })
})

describe('PaymentDropdown', () => {
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

    render(
      <PaymentDropdown
        payment={{ ...basePayment, ...paymentOverride }}
        isAdmin={isAdmin}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkPaid={onMarkPaid}
        deleteLoading={false}
      />
    )

    return { onView, onEdit, onDelete, onMarkPaid }
  }

  const openDropdown = () => {
    fireEvent.click(screen.getByRole('button'))
  }

  it('should render and open dropdown', () => {
    setup()
    openDropdown()

    expect(screen.getByText('Переглянути')).toBeInTheDocument()
  })

  it('should call onView', () => {
    const { onView } = setup()
    openDropdown()

    fireEvent.click(screen.getByText('Переглянути'))

    expect(onView).toHaveBeenCalled()
  })

  it('should call onEdit if admin', () => {
    const { onEdit } = setup({}, true)
    openDropdown()

    fireEvent.click(screen.getByText('Редагувати'))

    expect(onEdit).toHaveBeenCalled()
  })

  it('should not show edit if not admin', () => {
    setup({}, false)
    openDropdown()

    expect(screen.queryByText('Редагувати')).not.toBeInTheDocument()
  })

  it('should call onMarkPaid for debit payment', () => {
    const { onMarkPaid } = setup({ type: Operations.Debit })
    openDropdown()

    fireEvent.click(screen.getByText('Позначити оплату'))

    expect(onMarkPaid).toHaveBeenCalled()
  })

  it('should NOT show mark paid for credit payment', () => {
    setup({ type: Operations.Credit })
    openDropdown()

    expect(
      screen.queryByText('Позначити оплату')
    ).not.toBeInTheDocument()
  })
})