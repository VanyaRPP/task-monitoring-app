import { render, screen, fireEvent } from '@testing-library/react'
import { Form } from 'antd'
import DomainsSelect from './DomainsSelect'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsQuery: jest.fn(),
}))

const mockedQuery = useGetDomainsQuery as jest.Mock

const Wrapper = ({ allowCreate = false }: { allowCreate?: boolean }) => {
  const [form] = Form.useForm()
  return (
    <Form form={form}>
      <DomainsSelect form={form} allowCreate={allowCreate} />
    </Form>
  )
}

const getDomainInput = () => screen.getByRole('combobox')

describe('DomainsSelect — поле надавача послуг', () => {
  afterEach(() => jest.clearAllMocks())

  it('при allowCreate показує кнопку створення в дропдауні', () => {
    mockedQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getDomainInput())

    expect(screen.getByText('Створити нового надавача')).toBeInTheDocument()
  })

  it('кнопка створення показує інпут назви', () => {
    mockedQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getDomainInput())
    fireEvent.click(screen.getByText('Створити нового надавача'))

    expect(
      screen.getByPlaceholderText('Назва нового надавача послуг')
    ).toBeInTheDocument()
  })

  it('без allowCreate не показує кнопку створення', () => {
    mockedQuery.mockReturnValue({
      data: [
        { _id: 'd1', name: 'Alpha' },
        { _id: 'd2', name: 'Beta' },
      ],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper />)
    fireEvent.mouseDown(getDomainInput())

    expect(
      screen.queryByText('Створити нового надавача')
    ).not.toBeInTheDocument()
  })
})
