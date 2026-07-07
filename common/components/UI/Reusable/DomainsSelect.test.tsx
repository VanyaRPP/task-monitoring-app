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
      <Form.Item shouldUpdate>
        {() => (
          <div data-testid="domain-value">
            {String(form.getFieldValue('domain') ?? '')}
          </div>
        )}
      </Form.Item>
    </Form>
  )
}

const getDomainInput = () => screen.getByRole('combobox')
const domainValue = () => screen.getByTestId('domain-value').textContent

// Simulate typing a name into the search box and leaving the field.
const typeAndBlur = (name: string) => {
  const input = getDomainInput()
  fireEvent.mouseDown(input)
  fireEvent.change(input, { target: { value: name } })
  fireEvent.blur(input)
}

// Simulate typing a name and pressing Enter (without leaving the field).
const typeAndEnter = (name: string) => {
  const input = getDomainInput()
  fireEvent.mouseDown(input)
  fireEvent.change(input, { target: { value: name } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
}

describe('DomainsSelect — поле надавача послуг', () => {
  beforeEach(() => {
    mockTemplates.mockReturnValue({ data: [], isLoading: false })
  })
  afterEach(() => jest.clearAllMocks())

  it('рендерить наявних надавачів як опції', () => {
    mockDomains.mockReturnValue({
      data: [
        { _id: 'd1', name: 'Alpha' },
        { _id: 'd2', name: 'Beta' },
      ],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getDomainInput())

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('введення назви наявного надавача обирає його (не створює нового)', () => {
    mockDomains.mockReturnValue({
      data: [{ _id: 'd1', name: 'Alpha' }],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    typeAndBlur('Alpha')

    expect(domainValue()).toBe('d1')
    // не перейшли в режим створення
    expect(screen.queryByPlaceholderText('Назва надавача')).toBeNull()
  })

  it('збіг ігнорує регістр і зайві пробіли', () => {
    mockDomains.mockReturnValue({
      data: [{ _id: 'd1', name: 'Alpha' }],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    typeAndBlur('  aLpHa  ')

    expect(domainValue()).toBe('d1')
  })

  it('введення нової назви робить її новим надавачем без кнопки «Створити»', async () => {
    mockDomains.mockReturnValue({
      data: [{ _id: 'd1', name: 'Alpha' }],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    typeAndBlur('Gamma')

    expect(domainValue()).toBe('new::Gamma')
    // автоматично показались додаткові поля
    expect(
      await screen.findByPlaceholderText('Назва надавача')
    ).toBeInTheDocument()
    expect(screen.getByText('Напрямок послуг')).toBeInTheDocument()
  })

  it('Enter створює нового надавача з введеної назви (не зтирає текст)', async () => {
    mockDomains.mockReturnValue({
      data: [{ _id: 'd1', name: 'Alpha' }],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    typeAndEnter('Gamma')

    expect(domainValue()).toBe('new::Gamma')
    expect(
      await screen.findByPlaceholderText('Назва надавача')
    ).toBeInTheDocument()
  })

  it('Enter на назві наявного надавача обирає його', () => {
    mockDomains.mockReturnValue({
      data: [{ _id: 'd1', name: 'Alpha' }],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    typeAndEnter('Alpha')

    expect(domainValue()).toBe('d1')
  })

  it('немає кнопки «Створити» у дропдауні', () => {
    mockDomains.mockReturnValue({
      data: [{ _id: 'd1', name: 'Alpha' }],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getDomainInput())

    expect(screen.queryByText(/Створити/)).toBeNull()
  })

  it('коли у користувача ще немає надавачів — одразу показує поля створення', async () => {
    mockDomains.mockReturnValue({ data: [], isLoading: false, isError: false })

    render(<Wrapper allowCreate />)

    expect(
      await screen.findByPlaceholderText('Назва надавача')
    ).toBeInTheDocument()
    expect(domainValue()).toBe('new::')
  })

  it('пошук лише серед доступних користувачу: чужа назва вважається новою', () => {
    // Beta існує в іншого користувача, тож його немає у відповіді запиту.
    mockDomains.mockReturnValue({
      data: [{ _id: 'd1', name: 'Alpha' }],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper allowCreate />)
    typeAndBlur('Beta')

    expect(domainValue()).toBe('new::Beta')
  })

  it('без allowCreate введена нова назва не стає новим надавачем', () => {
    mockDomains.mockReturnValue({
      data: [
        { _id: 'd1', name: 'Alpha' },
        { _id: 'd2', name: 'Beta' },
      ],
      isLoading: false,
      isError: false,
    })

    render(<Wrapper />)
    typeAndBlur('Gamma')

    expect(domainValue()).not.toContain('new::')
    expect(screen.queryByPlaceholderText('Назва надавача')).toBeNull()
  })
})
