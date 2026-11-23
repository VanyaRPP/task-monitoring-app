import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Form, FormInstance, Input } from 'antd'
import AddressesSelect from './AddressesSelect'

let streets: {
  _id: string
  address: string
  city: string
  hasService: boolean
}[] = []
let isStreetsLoading = false

jest.mock('@common/api/streetApi/street.api', () => ({
  useGetAllStreetsQuery: () => ({
    data: [...streets],
    isLoading: isStreetsLoading,
    isError: false,
  }),
  useAddStreetMutation: () => [jest.fn()],
}))

const STREET_B = {
  _id: 'streetB',
  address: 'Мала Бердичівська 17 Б',
  city: 'Житомир',
  hasService: true,
}
const STREET_V = {
  _id: 'streetV',
  address: 'Мала Бердичівська 17 В',
  city: 'Житомир',
  hasService: true,
}
const STREET_NO_SERVICE = {
  _id: 'streetG',
  address: 'Мала Бердичівська 17 Г',
  city: 'Житомир',
  hasService: false,
}

const labelOf = (street: { address: string; city: string }) =>
  `${street.address} (м. ${street.city})`

let capturedForm: FormInstance | null = null

const Wrapper = ({
  edit,
  street,
  initialStreet,
  onStreetHasServiceChange,
}: {
  edit?: boolean
  street?: string
  initialStreet?: string
  onStreetHasServiceChange?: (hasService: boolean) => void
}) => {
  const [form] = Form.useForm()
  capturedForm = form

  return (
    <Form form={form} initialValues={{ domain: 'd1', street: initialStreet }}>
      <Form.Item name="domain" hidden>
        <Input />
      </Form.Item>
      <AddressesSelect
        form={form}
        edit={edit}
        street={street}
        onStreetHasServiceChange={onStreetHasServiceChange}
      />
    </Form>
  )
}

const openDropdown = () => {
  const selector = document.querySelector('.ant-select-selector')
  if (!selector) throw new Error('Селектор адрес не відрендерився')
  fireEvent.mouseDown(selector)
}

const pickOption = async (street: { address: string; city: string }) => {
  openDropdown()

  const option = await screen.findByTitle(labelOf(street))
  fireEvent.click(option)
}

const selectedLabel = () =>
  document.querySelector('.ant-select-selection-item')?.getAttribute('title')

beforeEach(() => {
  streets = [STREET_B, STREET_V, STREET_NO_SERVICE]
  isStreetsLoading = false
  capturedForm = null
})

describe('AddressesSelect — вибір адреси не відкочується', () => {
  it('зберігає вибрану адресу замість повернення до першої зі списку', async () => {
    render(<Wrapper />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetB')
    )

    await pickOption(STREET_V)

    expect(capturedForm?.getFieldValue('street')).toBe('streetV')
    await waitFor(() => expect(selectedLabel()).toBe(labelOf(STREET_V)))
    expect(capturedForm?.getFieldValue('street')).toBe('streetV')
  })

  it('не скидає вибір, коли список адрес перезавантажується', async () => {
    const { rerender } = render(<Wrapper />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetB')
    )
    await pickOption(STREET_V)

    streets = [{ ...STREET_B }, { ...STREET_V }, { ...STREET_NO_SERVICE }]
    rerender(<Wrapper />)

    await waitFor(() => expect(selectedLabel()).toBe(labelOf(STREET_V)))
    expect(capturedForm?.getFieldValue('street')).toBe('streetV')
  })

  it('дозволяє повторно перемкнути адресу після першої зміни', async () => {
    render(<Wrapper />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetB')
    )

    await pickOption(STREET_V)
    await waitFor(() => expect(selectedLabel()).toBe(labelOf(STREET_V)))

    await pickOption(STREET_NO_SERVICE)

    await waitFor(() =>
      expect(selectedLabel()).toBe(labelOf(STREET_NO_SERVICE))
    )
    expect(capturedForm?.getFieldValue('street')).toBe('streetG')
  })

  it('не повертає першу адресу після очищення селектора', async () => {
    render(<Wrapper />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetB')
    )
    await pickOption(STREET_V)

    const clear = document.querySelector('.ant-select-clear')
    if (!clear) throw new Error('Кнопка очищення не відрендерилась')
    fireEvent.mouseDown(clear)
    fireEvent.click(clear)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBeUndefined()
    )
    expect(selectedLabel()).toBeUndefined()
  })

  it('авто-обирає адресу лише коли поле порожнє', async () => {
    streets = [STREET_NO_SERVICE, STREET_V]
    render(<Wrapper />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetV')
    )
  })
})

describe('AddressesSelect — пресет від батьківської форми', () => {
  it('підставляє пресет, коли поле ще порожнє', async () => {
    render(<Wrapper street="streetG" />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetG')
    )
  })

  it('застосовує новий пресет поверх вибраної адреси (зміна компанії)', async () => {
    const { rerender } = render(<Wrapper street="streetB" />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetB')
    )
    await pickOption(STREET_V)
    await waitFor(() => expect(selectedLabel()).toBe(labelOf(STREET_V)))

    rerender(<Wrapper street="streetG" />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetG')
    )
  })

  it('не перезаписує вибір повторним рендером із тим самим пресетом', async () => {
    const { rerender } = render(<Wrapper street="streetB" />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetB')
    )
    await pickOption(STREET_V)

    rerender(<Wrapper street="streetB" />)

    await waitFor(() => expect(selectedLabel()).toBe(labelOf(STREET_V)))
    expect(capturedForm?.getFieldValue('street')).toBe('streetV')
  })

  it('у режимі редагування пресет не чіпає адресу сутності', async () => {
    render(<Wrapper edit initialStreet="streetV" street="streetB" />)

    await waitFor(() => expect(selectedLabel()).toBe(labelOf(STREET_V)))
    expect(capturedForm?.getFieldValue('street')).toBe('streetV')
  })

  it('ігнорує пресет з адресою, якої немає серед опцій домену', async () => {
    render(<Wrapper street="streetFromAnotherDomain" />)

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetB')
    )
  })
})

describe('AddressesSelect — onStreetHasServiceChange', () => {
  it('повідомляє прапорець саме вибраної адреси після перемикання', async () => {
    const onStreetHasServiceChange = jest.fn()
    render(<Wrapper onStreetHasServiceChange={onStreetHasServiceChange} />)

    await waitFor(() =>
      expect(onStreetHasServiceChange).toHaveBeenCalledWith(true)
    )

    await pickOption(STREET_NO_SERVICE)

    await waitFor(() =>
      expect(onStreetHasServiceChange).toHaveBeenLastCalledWith(false)
    )
  })

  it('повідомляє прапорець пресету, а не першої адреси з послугою', async () => {
    const onStreetHasServiceChange = jest.fn()
    render(
      <Wrapper
        street="streetG"
        onStreetHasServiceChange={onStreetHasServiceChange}
      />
    )

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe('streetG')
    )
    await waitFor(() =>
      expect(onStreetHasServiceChange).toHaveBeenLastCalledWith(false)
    )
  })
})
