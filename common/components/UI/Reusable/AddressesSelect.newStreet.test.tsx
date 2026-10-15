import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Form, FormInstance, Input } from 'antd'
import { makeNewEntityValue } from '@utils/inlineCreate'
import AddressesSelect from './AddressesSelect'

const addStreetMock = jest.fn()
let streets: { _id: string; address: string; city: string }[] = []

jest.mock('@common/api/streetApi/street.api', () => ({
  useGetAllStreetsQuery: () => ({
    data: [...streets],
    isLoading: false,
    isError: false,
  }),
  useAddStreetMutation: () => [addStreetMock],
}))

let capturedForm: FormInstance | null = null

const Wrapper = ({ domain, street }: { domain: string; street?: string }) => {
  const [form] = Form.useForm()
  capturedForm = form
  return (
    <Form form={form} initialValues={{ domain, street }}>
      <Form.Item name="domain" hidden>
        <Input />
      </Form.Item>
      <AddressesSelect form={form} required={false} />
    </Form>
  )
}

const NEW_STREET = makeNewEntityValue('вул. Шевченка, 5::Львів')

describe('AddressesSelect - an address created on save', () => {
  beforeEach(() => {
    streets = []
    addStreetMock.mockReset()
  })

  it("keeps the AI draft's new address for a new provider and shows it", async () => {
    render(<Wrapper domain={makeNewEntityValue('Олег')} street={NEW_STREET} />)

    expect(
      await screen.findByText('вул. Шевченка, 5 (м. Львів) — нова')
    ).toBeInTheDocument()
    expect(capturedForm?.getFieldValue('street')).toBe(NEW_STREET)
  })

  it("is not swapped for one of an existing provider's addresses", async () => {
    streets = [
      { _id: 'st-1', address: 'Мала Бердичівська 17', city: 'Житомир' },
    ]
    render(<Wrapper domain="d1" street={NEW_STREET} />)

    await screen.findByText('вул. Шевченка, 5 (м. Львів) — нова')
    expect(capturedForm?.getFieldValue('street')).toBe(NEW_STREET)
  })

  it('for a new provider, a typed address waits for save instead of the API', async () => {
    render(<Wrapper domain={makeNewEntityValue('Олег')} />)

    const selector = document.querySelector('.ant-select-selector')
    if (!selector) throw new Error('no address select')
    fireEvent.mouseDown(selector)
    fireEvent.click(await screen.findByText('Створити нову вулицю'))
    fireEvent.change(screen.getByPlaceholderText('Адреса'), {
      target: { value: 'вул. Шевченка, 5' },
    })
    fireEvent.change(screen.getByPlaceholderText('Місто'), {
      target: { value: 'Львів' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    await waitFor(() =>
      expect(capturedForm?.getFieldValue('street')).toBe(NEW_STREET)
    )
    expect(addStreetMock).not.toHaveBeenCalled()
  })
})
