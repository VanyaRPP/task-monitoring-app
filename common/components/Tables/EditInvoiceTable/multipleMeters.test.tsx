import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { ServiceType } from '@utils/constants'
import { EditInvoicesTable_unstable } from './index'

jest.mock('@components/AddPaymentModal', () => ({
  __esModule: true,
  usePaymentContext: () => ({}),
}))
jest.mock('@modules/hooks/useInvoiceCurrency', () => ({
  __esModule: true,
  useInvoiceCurrency: () => 'UAH',
}))
jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({
    data: { data: [] },
    isLoading: false,
  }),
}))

const invoice = [
  {
    type: ServiceType.Electricity,
    price: 10,
    lastAmount: 100,
    amount: 130,
    sum: 300,
  },
  {
    type: ServiceType.Electricity,
    serviceId: 'svc-1',
    name: 'електрика(1)',
    customName: 'електрика(1)',
    price: 8,
    lastAmount: 10,
    amount: 20,
    sum: 80,
  },
  {
    type: ServiceType.Electricity,
    serviceId: 'svc-4',
    name: 'електропостача(4)',
    customName: 'електропостача(4)',
    price: 6,
    lastAmount: 5,
    amount: 15,
    sum: 60,
  },
]

const Wrapper = ({ editable }: { editable: boolean }) => {
  const [form] = Form.useForm()
  return (
    <Form form={form} initialValues={{ invoice }}>
      <EditInvoicesTable_unstable
        form={form}
        editable={editable}
        domainId="d1"
      />
    </Form>
  )
}

describe('довідка: кілька лічильників одного типу', () => {
  it('у превʼю кожен рядок показує власну назву', () => {
    render(<Wrapper editable={false} />)

    expect(screen.getByText('електрика(1)')).toBeInTheDocument()
    expect(screen.getByText('електропостача(4)')).toBeInTheDocument()
    expect(screen.getAllByText('Електропостачання')).toHaveLength(1)
  })

  it('у режимі редагування назви теж різні', () => {
    render(<Wrapper editable />)

    const values = Array.from(document.querySelectorAll('input')).map(
      (input) => (input as HTMLInputElement).value
    )

    expect(values).toEqual(
      expect.arrayContaining([
        'Електропостачання',
        'електрика(1)',
        'електропостача(4)',
      ])
    )
  })
})
