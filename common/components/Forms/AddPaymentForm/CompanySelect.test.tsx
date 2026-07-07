import { render, screen, fireEvent } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { Form, Input } from 'antd'
import CompanySelect from './CompanySelect'
import { makeNewEntityValue } from '@utils/inlineCreate'
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
      <Form.Item shouldUpdate>
        {() => (
          <div data-testid="company-value">
            {String(form.getFieldValue('company') ?? '')}
          </div>
        )}
      </Form.Item>
    </Form>
  )
}

const getCompanyInput = () => screen.getByRole('combobox')
const companyValue = () => screen.getByTestId('company-value').textContent

const typeAndBlur = (name: string) => {
  const input = getCompanyInput()
  fireEvent.mouseDown(input)
  fireEvent.change(input, { target: { value: name } })
  fireEvent.blur(input)
}

const typeAndEnter = (name: string) => {
  const input = getCompanyInput()
  fireEvent.mouseDown(input)
  fireEvent.change(input, { target: { value: name } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
}

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

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getCompanyInput())

    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()
  })

  it('введення назви наявної компанії обирає її (не створює нову)', () => {
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c2', companyName: 'Globex' },
        ],
      },
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    typeAndBlur('Globex')

    expect(companyValue()).toBe('c2')
    expect(screen.queryByPlaceholderText('Назва нової компанії')).toBeNull()
  })

  it('введення нової назви робить її новою компанією без кнопки «Створити»', async () => {
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c2', companyName: 'Globex' },
        ],
      },
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    typeAndBlur('Newco')

    expect(companyValue()).toBe('new::Newco')
    // автоматично показались додаткові поля (назва + пошта)
    expect(
      await screen.findByPlaceholderText('Назва нової компанії')
    ).toBeInTheDocument()
    expect(screen.getByText('Пошта компанії')).toBeInTheDocument()
  })

  it('Enter створює нову компанію з введеної назви (не зтирає текст)', async () => {
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c2', companyName: 'Globex' },
        ],
      },
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    typeAndEnter('Newco')

    expect(companyValue()).toBe('new::Newco')
    expect(
      await screen.findByPlaceholderText('Назва нової компанії')
    ).toBeInTheDocument()
  })

  it('Enter на назві наявної компанії обирає її', () => {
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c2', companyName: 'Globex' },
        ],
      },
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    typeAndEnter('Globex')

    expect(companyValue()).toBe('c2')
  })

  it('немає кнопки «Створити» у дропдауні', () => {
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c2', companyName: 'Globex' },
        ],
      },
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    fireEvent.mouseDown(getCompanyInput())

    expect(screen.queryByText(/Створити/)).toBeNull()
  })

  it('коли у користувача ще немає компаній — одразу показує поля створення', async () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper allowCreate />)

    expect(
      await screen.findByPlaceholderText('Назва нової компанії')
    ).toBeInTheDocument()
    expect(companyValue()).toBe('new::')
  })

  it('пошук лише серед доступних користувачу: чужа назва вважається новою', () => {
    // Globex існує в іншого користувача, тож його немає у відповіді запиту.
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c3', companyName: 'Beta' },
        ],
      },
      isLoading: false,
    })

    render(<Wrapper allowCreate />)
    typeAndBlur('Globex')

    expect(companyValue()).toBe('new::Globex')
  })

  it('без allowCreate введена нова назва не стає новою компанією', () => {
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
    typeAndBlur('Newco')

    expect(companyValue()).not.toContain('new::')
    expect(screen.queryByPlaceholderText('Назва нової компанії')).toBeNull()
  })

  it('коли надавач у режимі створення — компанія теж одразу в режимі створення', async () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(
      <Wrapper
        initialValues={{ domain: makeNewEntityValue('Новий'), street: 's1' }}
        allowCreate
      />
    )

    expect(
      await screen.findByPlaceholderText('Назва нової компанії')
    ).toBeInTheDocument()
    expect(companyValue()).toBe('new::')
    // немає куди «повертатися» — наявних компаній нема
    expect(screen.queryByText('← обрати наявну')).toBeNull()
  })

  it('перемикання надавача в режим створення переводить компанію в режим створення (не лишає порожній селект)', async () => {
    mockedQuery.mockReturnValue({
      data: {
        data: [
          { _id: 'c1', companyName: 'Acme' },
          { _id: 'c2', companyName: 'Globex' },
        ],
      },
      isLoading: false,
    })

    const RaceWrapper = () => {
      const [form] = Form.useForm()
      const domainId = Form.useWatch('domain', form)
      const first = useRef(true)
      useEffect(() => {
        if (first.current) {
          first.current = false
          return
        }
        form.resetFields(['company'])
      }, [domainId, form])
      return (
        <Form
          form={form}
          initialValues={{ domain: 'd1', street: 's1', company: 'c1' }}
        >
          <Form.Item name="domain" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="street" hidden>
            <Input />
          </Form.Item>
          <CompanySelect form={form} allowCreate />
          <button
            type="button"
            onClick={() =>
              form.setFieldValue('domain', makeNewEntityValue('Новий'))
            }
          >
            go-new-domain
          </button>
          <div data-testid="company-value">
            {String(form.getFieldValue('company') ?? '')}
          </div>
        </Form>
      )
    }

    render(<RaceWrapper />)
    fireEvent.click(screen.getByText('go-new-domain'))

    expect(
      await screen.findByPlaceholderText('Назва нової компанії')
    ).toBeInTheDocument()
  })
})
