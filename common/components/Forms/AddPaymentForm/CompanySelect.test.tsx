import { render, screen, fireEvent } from '@testing-library/react'
import { Form, Input } from 'antd'
import CompanySelect from './CompanySelect'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))

jest.mock('@components/UI/RealEstateComponents/RealEstateModal', () => ({
  __esModule: true,
  default: ({
    chosenRealEstate,
  }: {
    chosenRealEstate: { domain: string; street?: string } | null
  }) => (
    <div data-testid="real-estate-modal">
      modal:{chosenRealEstate?.domain}:{chosenRealEstate?.street}
    </div>
  ),
}))

const mockedQuery = useGetAllRealEstateQuery as jest.Mock

const Wrapper = ({
  initialValues = { domain: 'd1', street: 's1', monthService: 'm1' },
}: {
  initialValues?: { domain?: string; street?: string; monthService?: string }
}) => {
  const [form] = Form.useForm()
  return (
    <Form form={form} initialValues={initialValues}>
      <Form.Item name="domain" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="street" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="monthService" hidden>
        <Input />
      </Form.Item>
      <CompanySelect form={form} />
    </Form>
  )
}

describe('CompanySelect — поле вибору компанії', () => {
  afterEach(() => jest.clearAllMocks())

  it('показує «Немає компанії? Створити», коли для вибору немає жодної компанії', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper />)

    expect(screen.getByText('Немає компанії? Створити')).toBeInTheDocument()
  })

  it('показує кнопку створення, коли обрано домен і адресу, навіть без місяця', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper initialValues={{ domain: 'd1', street: 's1' }} />)

    expect(screen.getByText('Немає компанії? Створити')).toBeInTheDocument()
  })

  it('показує кнопку створення лише з доменом (адреса необовʼязкова)', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper initialValues={{ domain: 'd1' }} />)

    expect(screen.getByText('Немає компанії? Створити')).toBeInTheDocument()
  })

  it('відкриває модалку компанії з підставленими доменом і адресою', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper />)

    expect(screen.queryByTestId('real-estate-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Немає компанії? Створити'))

    const modal = screen.getByTestId('real-estate-modal')
    expect(modal).toHaveTextContent('modal:d1:s1')
  })

  it('ховає кнопку створення, поки компанії завантажуються', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: true })

    render(<Wrapper />)

    expect(
      screen.queryByText('Немає компанії? Створити')
    ).not.toBeInTheDocument()
  })

  it('не показує кнопку створення, коли компанія вже існує', () => {
    mockedQuery.mockReturnValue({
      data: { data: [{ _id: 'c1', companyName: 'Acme' }] },
      isLoading: false,
    })

    render(<Wrapper />)

    expect(
      screen.queryByText('Немає компанії? Створити')
    ).not.toBeInTheDocument()
  })
})
