import { render, screen, fireEvent } from '@testing-library/react'
import { Form, FormInstance } from 'antd'
import RealEstateForm from './index'

const addressesSpy = jest.fn()

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainByPkQuery: () => ({
    data: { _id: 'd1', customServices: [] },
    isLoading: false,
    isError: false,
  }),
}))

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: () => ({ data: { data: [] } }),
}))

jest.mock('../../../Reusable/AddressesSelect', () => ({
  __esModule: true,
  default: (props: { street?: string }) => {
    addressesSpy(props)
    return <div data-testid="addresses-select" />
  },
}))

jest.mock('../../../Reusable/DomainsSelect', () => ({
  __esModule: true,
  default: () => <div data-testid="domains-select" />,
}))

jest.mock('@components/UI/Reusable/EmailSelect', () => ({
  __esModule: true,
  default: () => <div data-testid="email-select" />,
}))

jest.mock('../../../CustomServicesCard', () => ({
  __esModule: true,
  default: () => <div data-testid="custom-services" />,
}))

const Wrapper = ({ preselectedStreet }: { preselectedStreet?: string }) => {
  const [form] = Form.useForm()
  return (
    <RealEstateForm
      form={form as FormInstance}
      setIsValueChanged={() => undefined}
      preselectedStreet={preselectedStreet}
    />
  )
}

describe('RealEstateForm — префіл адреси', () => {
  afterEach(() => jest.clearAllMocks())

  it('передає preselectedStreet у AddressesSelect у режимі створення', () => {
    render(<Wrapper preselectedStreet="s1" />)

    expect(addressesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ street: 's1' })
    )
  })

  it('передає undefined як адресу, коли її не підставлено', () => {
    render(<Wrapper />)

    expect(addressesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ street: undefined })
    )
  })
})

describe('RealEstateForm — вкладки (Tabs)', () => {
  it('відображає вкладку "Послуги" та рендерить CustomServicesCard при перемиканні', () => {
    render(<Wrapper />)

    const servicesTab = screen.getByText('Послуги')
    expect(servicesTab).toBeInTheDocument()

    fireEvent.click(servicesTab)

    expect(screen.getByTestId('custom-services')).toBeInTheDocument()
  })

  it('відображає вкладку "Договір" з полем номера договору', () => {
    render(<Wrapper />)

    const contractTab = screen.getByText('Договір')
    expect(contractTab).toBeInTheDocument()

    fireEvent.click(contractTab)

    expect(screen.getByLabelText('Номер договору')).toBeInTheDocument()
  })

  it('записує введений номер договору у форму', () => {
    const formRef: { current: FormInstance | null } = { current: null }
    const CaptureWrapper = () => {
      const [form] = Form.useForm()
      formRef.current = form
      return (
        <RealEstateForm
          form={form as FormInstance}
          setIsValueChanged={() => undefined}
        />
      )
    }
    render(<CaptureWrapper />)

    fireEvent.click(screen.getByText('Договір'))
    fireEvent.change(screen.getByLabelText('Номер договору'), {
      target: { value: '15' },
    })

    expect(formRef.current?.getFieldValue('contractNumber')).toBe('15')
  })

  it('віддає номер договору через validateFields — саме його читає handleSubmit', async () => {
    const formRef: { current: FormInstance | null } = { current: null }
    const CaptureWrapper = () => {
      const [form] = Form.useForm()
      formRef.current = form
      return (
        <RealEstateForm
          form={form as FormInstance}
          setIsValueChanged={() => undefined}
        />
      )
    }
    render(<CaptureWrapper />)

    fireEvent.click(screen.getByText('Договір'))
    fireEvent.change(screen.getByLabelText('Номер договору'), {
      target: { value: '15' },
    })

    const values = await formRef.current?.validateFields(['contractNumber'])
    expect(values).toMatchObject({ contractNumber: '15' })
  })

  it('відображає поле дати договору на вкладці "Договір"', () => {
    render(<Wrapper />)

    fireEvent.click(screen.getByText('Договір'))

    expect(screen.getByLabelText('Дата договору')).toBeInTheDocument()
  })
})
