import { render, screen, fireEvent } from '@testing-library/react'
import { Form, Input } from 'antd'
import CompanySelect from './CompanySelect'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))

const mockedQuery = useGetAllRealEstateQuery as jest.Mock

const Wrapper = ({
  initialValues = { domain: 'd1', street: 's1' },
  allowCreate = false,
}: {
  initialValues?: { domain?: string; street?: string }
  allowCreate?: boolean
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
      <CompanySelect form={form} allowCreate={allowCreate} />
    </Form>
  )
}

const getCompanyInput = () => screen.getByRole('combobox')

describe('CompanySelect — поле вибору компанії', () => {
  afterEach(() => jest.clearAllMocks())

  it('показує заглушку, коли надавача послуг ще не обрано', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper initialValues={{}} />)

    expect(
      screen.getByText('Спершу оберіть надавача послуг')
    ).toBeInTheDocument()
  })

  it('рендерить наявні компанії як опції', () => {
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c2', companyName: 'Globex' },
        ],
      },
      isLoading: false,
    })

    render(<Wrapper />)
    fireEvent.mouseDown(getCompanyInput())

    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()
  })

  it('при allowCreate показує кнопку створення в дропдауні', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getCompanyInput())

    expect(screen.getByText('Створити нову компанію')).toBeInTheDocument()
  })

  it('кнопка створення показує інпути назви та пошти', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getCompanyInput())
    fireEvent.click(screen.getByText('Створити нову компанію'))

    expect(
      screen.getByPlaceholderText('Назва нової компанії')
    ).toBeInTheDocument()
    expect(screen.getByText('Пошта компанії')).toBeInTheDocument()
  })

  it('без allowCreate не показує кнопку створення', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper />)
    fireEvent.mouseDown(getCompanyInput())

    expect(screen.queryByText('Створити нову компанію')).not.toBeInTheDocument()
    expect(screen.queryByText('Пошта компанії')).not.toBeInTheDocument()
  })
})
