import { render, screen, fireEvent } from '@testing-library/react'
import { Form, FormInstance } from 'antd'
import RealEstateForm from './index'

const addressesSpy = jest.fn()

// Каталог домену за замовчуванням порожній; тести «за площею» його підмінюють.
const domainMock: { customServices: { services: string[] }[] } = {
  customServices: [],
}

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainByPkQuery: () => ({
    data: { _id: 'd1', customServices: domainMock.customServices },
    isLoading: false,
    isError: false,
  }),
  useGetDomainTypeTemplatesQuery: () => ({ data: [] }),
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

const Wrapper = ({
  preselectedStreet,
  customServices,
}: {
  preselectedStreet?: string
  customServices?: any[]
}) => {
  const [form] = Form.useForm()
  return (
    <RealEstateForm
      form={form as FormInstance}
      setIsValueChanged={() => undefined}
      preselectedStreet={preselectedStreet}
      customServices={customServices}
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

/**
 * Поля «Площа (м²)» і «Ціна (грн/м²)» живлять формулу Розміщення/Утримання в
 * Payment Bulk. Вони мають з'являтися не лише для сидованих послуг, а й для
 * per-domain копії з тегом serviceType — інакше тариф множився б на
 * незаповнену площу.
 */
describe('RealEstateForm — поля «за площею»', () => {
  const PLACING_SEED_ID = '682dd48d9665126611c81950'

  const areaFieldShown = () => screen.queryByLabelText('Площа (м²)') !== null

  afterEach(() => {
    domainMock.customServices = []
  })

  it('прихована, коли в домені немає жодної послуги «за площею»', () => {
    render(<Wrapper customServices={[]} />)

    expect(areaFieldShown()).toBe(false)
  })

  it('показана для сидованого Розміщення (за закріпленим _id)', () => {
    domainMock.customServices = [{ services: [PLACING_SEED_ID] }]
    render(<Wrapper customServices={[]} />)

    expect(areaFieldShown()).toBe(true)
  })

  it('показана для per-domain копії з serviceType = Розміщення', () => {
    render(
      <Wrapper
        customServices={[
          {
            _id: '68a0000000000000000000b7',
            label: 'Розміщення (паркінг)',
            fieldName: 'rozmishchenniaParkinh',
            serviceType: 'placingPrice',
          },
        ]}
      />
    )

    expect(areaFieldShown()).toBe(true)
  })

  it('показана для per-domain копії з serviceType = Утримання', () => {
    render(
      <Wrapper
        customServices={[
          {
            _id: '68a0000000000000000000b8',
            label: 'Утримання (склад)',
            fieldName: 'utrymanniaSklad',
            serviceType: 'maintenancePrice',
          },
        ]}
      />
    )

    expect(areaFieldShown()).toBe(true)
  })

  it('не реагує на копію іншого типу (електрика)', () => {
    render(
      <Wrapper
        customServices={[
          {
            _id: '68a0000000000000000000b9',
            label: 'Електрика (склад)',
            fieldName: 'elektrykaSklad',
            serviceType: 'electricityPrice',
          },
        ]}
      />
    )

    expect(areaFieldShown()).toBe(false)
  })
})
