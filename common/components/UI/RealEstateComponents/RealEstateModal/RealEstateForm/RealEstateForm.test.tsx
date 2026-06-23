import { render } from '@testing-library/react'
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
