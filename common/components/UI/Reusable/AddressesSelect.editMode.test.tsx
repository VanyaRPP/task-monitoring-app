import { render } from '@testing-library/react'
import { Form, FormInstance, Input } from 'antd'
import AddressesSelect from './AddressesSelect'

jest.mock('@common/api/streetApi/street.api', () => ({
  useGetAllStreetsQuery: () => {
    return {
      data: [
        {
          _id: 'streetB',
          address: 'Мала Бердичівська 17 Б',
          city: 'Житомир',
          hasService: true,
        },
        {
          _id: 'streetV',
          address: 'Мала Бердичівська 17 В',
          city: 'Житомир',
          hasService: true,
        },
      ],
      isLoading: false,
      isError: false,
    }
  },
  useAddStreetMutation: () => [jest.fn()],
}))

let capturedForm: FormInstance | null = null

const Wrapper = ({
  edit,
  initialStreet,
}: {
  edit?: boolean
  initialStreet?: string
}) => {
  const [form] = Form.useForm()
  capturedForm = form
  return (
    <AddressesSelectProbe
      form={form}
      edit={edit}
      initialStreet={initialStreet}
    />
  )
}

const AddressesSelectProbe = ({
  form,
  edit,
  initialStreet,
}: {
  form: FormInstance
  edit?: boolean
  initialStreet?: string
}) => {
  // Mirrors how RealEstateModal actually populates the form: the company's
  // own, already-valid street is present in the form store from the start
  // (via initialValues here, via setFieldsValue there) before
  // AddressesSelect's own street-list effect gets a chance to run. In the
  // real form, "domain" is registered by DomainsSelect — replicate that
  // with a plain hidden field so initialValues actually takes effect.
  return (
    <Form form={form} initialValues={{ domain: 'd1', street: initialStreet }}>
      <Form.Item name="domain" hidden>
        <Input />
      </Form.Item>
      <AddressesSelect form={form} edit={edit} />
    </Form>
  )
}

describe('AddressesSelect — редагування компанії не змінює вже вибрану адресу', () => {
  afterEach(() => {
    capturedForm = null
  })

  it('в режимі редагування зберігає адресу компанії, а не перше значення зі списку', () => {
    render(<Wrapper edit initialStreet="streetV" />)

    expect(capturedForm?.getFieldValue('street')).toBe('streetV')
  })

  it('в режимі створення (не edit) авто-обирає першу адресу з послугою', () => {
    render(<Wrapper edit={false} />)

    expect(capturedForm?.getFieldValue('street')).toBe('streetB')
  })
})
