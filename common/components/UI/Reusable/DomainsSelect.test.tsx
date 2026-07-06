import { render, screen, fireEvent } from '@testing-library/react'
import { Form } from 'antd'
import DomainsSelect from './DomainsSelect'
import {
  useGetDomainsQuery,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsQuery: jest.fn(),
  useGetDomainTypeTemplatesQuery: jest.fn(),
}))

const mockDomains = useGetDomainsQuery as jest.Mock
const mockTemplates = useGetDomainTypeTemplatesQuery as jest.Mock

const Wrapper = ({ allowCreate = false }: { allowCreate?: boolean }) => {
  const [form] = Form.useForm()
  return (
    <Form form={form}>
      <DomainsSelect form={form} allowCreate={allowCreate} />
    </Form>
  )
}

const getDomainInput = () => screen.getByRole('combobox')

const startCreate = () => {
  fireEvent.mouseDown(getDomainInput())
  fireEvent.click(screen.getByText('Створити нового надавача'))
}

describe('DomainsSelect — поле надавача послуг', () => {
  beforeEach(() => {
    mockTemplates.mockReturnValue({ data: [], isLoading: false })
  })
  afterEach(() => jest.clearAllMocks())

  it('при allowCreate показує кнопку створення в дропдауні', () => {
    mockDomains.mockReturnValue({ data: [], isLoading: false, isError: false })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getDomainInput())

    expect(screen.getByText('Створити нового надавача')).toBeInTheDocument()
  })

  it('кнопка створення показує інпут назви та селектор напрямку', () => {
    mockDomains.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockTemplates.mockReturnValue({
      data: [{ _id: 't1', name: 'Комунальні', isBuiltIn: true, groups: [] }],
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    startCreate()

    expect(screen.getByPlaceholderText('Назва надавача')).toBeInTheDocument()
    expect(screen.getByText('Напрямок послуг')).toBeInTheDocument()
    // default value «Без послуг» is shown as the selected option
    expect(screen.getByText('Без послуг')).toBeInTheDocument()
  })

  it('у списку напрямків є вбудований шаблон', () => {
    mockDomains.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockTemplates.mockReturnValue({
      data: [{ _id: 't1', name: 'Комунальні', isBuiltIn: true, groups: [] }],
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    startCreate()
    // the only combobox in create mode is the service-type select
    fireEvent.mouseDown(screen.getByRole('combobox'))

    expect(screen.getByText('Комунальні')).toBeInTheDocument()
  })

  it('без allowCreate не показує кнопку створення', () => {
    mockDomains.mockReturnValue({
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
