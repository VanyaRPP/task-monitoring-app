import { render, screen, within, fireEvent } from '@testing-library/react'
import { Form, Input } from 'antd'
import MonthServiceSelect from './MonthServiceSelect'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { buildMonthServicePlaceholder } from './month-service-placeholder'
import dayjs from 'dayjs'

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn(),
}))

const mockedQuery = useGetAllServicesQuery as jest.Mock

const Wrapper = ({
  initialValues = {},
  edit,
}: {
  initialValues?: { domain?: string; street?: string; monthService?: string }
  edit?: boolean
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
      <MonthServiceSelect form={form} edit={edit} />
    </Form>
  )
}

const getMonthInput = () => screen.getByRole('combobox')

describe('MonthServiceSelect — поле вибору місяця', () => {
  afterEach(() => jest.clearAllMocks())

  it('вимкнене, якщо не обрано домен', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })
    render(<Wrapper initialValues={{}} />)
    expect(getMonthInput()).toBeDisabled()
  })

  it('увімкнене для домену без обраної вулиці (адреса необов’язкова)', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })
    render(<Wrapper initialValues={{ domain: 'd1' }} />)
    expect(getMonthInput()).not.toBeDisabled()
  })

  it('увімкнене для щойно створюваного (new::) домену', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })
    render(<Wrapper initialValues={{ domain: 'new::Новий домен' }} />)
    expect(getMonthInput()).not.toBeDisabled()
  })

  it('розпізнає плейсхолдер місяця і не робить запит "загубленого" сервіса по id', () => {
    const placeholder = buildMonthServicePlaceholder(dayjs('2026-07-01'))
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(
      <Wrapper
        initialValues={{
          domain: 'd1',
          street: 's1',
          monthService: placeholder,
        }}
      />
    )

    // Any call made with a `serviceId` param (the "lost service" lookup)
    // must be skipped for a placeholder value, regardless of re-render count.
    const serviceIdCalls = mockedQuery.mock.calls.filter((c) => c[0]?.serviceId)
    expect(serviceIdCalls.every((c) => c[1]?.skip === true)).toBe(true)
  })

  it('дропдаун містить опцію поточного місяця серед останніх 12', () => {
    mockedQuery.mockReturnValue({ data: { data: [] }, isLoading: false })

    render(<Wrapper initialValues={{ domain: 'd1', street: 's1' }} />)
    fireEvent.mouseDown(getMonthInput())

    const listbox = screen.getByRole('listbox')
    const currentMonthLabel = dayjs().format('MMMM YYYY')
    expect(within(listbox).getByText(currentMonthLabel)).toBeInTheDocument()
  })

  it('обраний місяць залишається на правильній позиції, а не переміщується в кінець списку', () => {
    const futureDate = dayjs().add(2, 'month').startOf('month')
    const missingService = {
      _id: 'svc-future',
      date: futureDate.toISOString(),
    }

    mockedQuery.mockImplementation((params: { serviceId?: string }) => {
      if (params?.serviceId) {
        return { data: { data: [missingService] }, isLoading: false }
      }
      return { data: { data: [] }, isLoading: false }
    })

    render(
      <Wrapper
        edit
        initialValues={{
          domain: 'd1',
          street: 's1',
          monthService: 'svc-future',
        }}
      />
    )
    fireEvent.mouseDown(getMonthInput())

    const listbox = screen.getByRole('listbox')
    const options = within(listbox).getAllByText(/\d{4}$/)
    const futureLabel = futureDate.format('MMMM YYYY')

    // The selected (future) month must sort to the top by date,
    // not fall to the bottom because its date lookup failed.
    expect(options[0].textContent).toContain(futureLabel)
  })
})
