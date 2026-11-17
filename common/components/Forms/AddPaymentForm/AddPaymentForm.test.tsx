import { expect } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { Form, FormInstance } from 'antd'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import AddPaymentForm from '.'

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))
const companiesQuery = useGetAllRealEstateQuery as jest.Mock

// What AddPaymentModal provides: the form and the company it has loaded for
// the selected id.
const mockContext: { form: FormInstance | null; company: unknown } = {
  form: null,
  company: null,
}
jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    form: mockContext.form,
    payment: undefined,
    service: null,
    company: mockContext.company,
  }),
}))

// The neighbours of the company field, reduced to the form fields they own.
jest.mock('@components/UI/Reusable/DomainsSelect', () => {
  const { Form: AntForm } = jest.requireActual('antd')
  const Mock = () => (
    <AntForm.Item name="domain">
      <input aria-label="domain" />
    </AntForm.Item>
  )
  return { __esModule: true, default: Mock }
})
jest.mock('@components/UI/Reusable/AddressesSelect', () => {
  const { Form: AntForm } = jest.requireActual('antd')
  const Mock = () => (
    <AntForm.Item name="street">
      <input aria-label="street" />
    </AntForm.Item>
  )
  return { __esModule: true, default: Mock }
})
jest.mock('./MonthServiceSelect', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('./InvoiceNumber', () => ({
  __esModule: true,
  default: () => <div data-testid="invoice-number" />,
}))
jest.mock('./InvoiceCreationDate', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('./PaymentPricesTable', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('./PaymentTotal', () => ({
  __esModule: true,
  default: () => null,
}))

interface WrapperProps {
  street?: string
  company?: unknown
  edit?: boolean
}

const Wrapper = ({
  street = 's1',
  company = null,
  edit = false,
}: WrapperProps) => {
  const [form] = Form.useForm()
  mockContext.form = form
  mockContext.company = company
  return (
    <Form
      form={form}
      initialValues={{ domain: 'd1', street, operation: 'debit' }}
    >
      <AddPaymentForm paymentActions={{ preview: false, edit }} />
      <Form.Item shouldUpdate>
        {() => (
          <div data-testid="street-value">
            {String(form.getFieldValue('street') ?? '')}
          </div>
        )}
      </Form.Item>
    </Form>
  )
}

const streetValue = () => screen.getByTestId('street-value').textContent

beforeEach(() => {
  jest.clearAllMocks()
  companiesQuery.mockReturnValue({ data: { data: [] }, isLoading: false })
})

describe('AddPaymentForm — компанія та адреса', () => {
  // The address used to be picked automatically for the provider and then
  // narrow the company list to that one address.
  it('список компаній не звужується обраною адресою', () => {
    render(<Wrapper street="s1" />)

    const requested = companiesQuery.mock.calls.map(([args]) => args)
    expect(requested).toContainEqual({ domainId: 'd1', streetId: undefined })
    expect(requested).not.toContainEqual(
      expect.objectContaining({ streetId: 's1' })
    )
  })

  it('компанія без адреси скидає адресу, підставлену для надавача', async () => {
    render(<Wrapper street="s1" company={{ _id: 'c1' }} />)

    await waitFor(() => expect(streetValue()).toBe(''))
  })

  it('компанія з адресою її не скидає', async () => {
    render(
      <Wrapper street="s1" company={{ _id: 'c1', street: { _id: 's1' } }} />
    )

    await waitFor(() => expect(companiesQuery).toHaveBeenCalled())
    expect(streetValue()).toBe('s1')
  })

  it('адреса, яку буде створено при збереженні, лишається', async () => {
    render(<Wrapper street="new::Main st::Kyiv" company={{ _id: 'c1' }} />)

    await waitFor(() => expect(companiesQuery).toHaveBeenCalled())
    expect(streetValue()).toBe('new::Main st::Kyiv')
  })

  it('під час редагування адреса рахунку не змінюється', async () => {
    render(<Wrapper street="s1" company={{ _id: 'c1' }} edit />)

    await waitFor(() => expect(companiesQuery).toHaveBeenCalled())
    expect(streetValue()).toBe('s1')
  })
})

describe('AddPaymentForm — згорнуті деталі', () => {
  // Number, date, currency and address set their own defaults; a collapsed
  // block that did not mount them would save the invoice without those.
  it('поля деталей змонтовані, навіть поки блок згорнутий', () => {
    render(<Wrapper />)

    expect(screen.getByText(/Адреса, номер, дата, валюта/)).toBeInTheDocument()
    expect(screen.getByTestId('invoice-number')).toBeInTheDocument()
    expect(screen.getByLabelText('street')).toBeInTheDocument()
  })

  it('перемикача «Дебет/Кредит» у формі немає', () => {
    render(<Wrapper />)

    expect(screen.queryByText('Тип оплати')).not.toBeInTheDocument()
  })
})
