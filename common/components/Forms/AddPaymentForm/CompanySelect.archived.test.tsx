import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, Input } from 'antd'
import CompanySelect from './CompanySelect'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))

const mockedQuery = useGetAllRealEstateQuery as jest.Mock

const ACTIVE = { _id: 'c-active', companyName: 'ТОВ Активна' }
const ARCHIVED = {
  _id: '64ff47a2a6ce612394047226',
  companyName: 'ТОВ Архівна',
  archived: true,
}

const mockLists = (archived: unknown[] = []) =>
  mockedQuery.mockImplementation((args: { archived?: boolean }) => ({
    data: { data: args?.archived ? archived : [ACTIVE] },
    isLoading: false,
  }))

const Wrapper = ({
  companyId,
  company,
}: {
  companyId: string
  company?: string | typeof ARCHIVED
}) => {
  const [form] = Form.useForm()
  return (
    <Form
      form={form}
      initialValues={{ domain: 'd1', street: 's1', company: companyId }}
    >
      <Form.Item name="domain" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="street" hidden>
        <Input />
      </Form.Item>
      <CompanySelect form={form} edit company={company} />
    </Form>
  )
}

describe('CompanySelect — архівна / недоступна компанія рахунку', () => {
  afterEach(() => jest.clearAllMocks())

  it('показує "Архівована" з назвою в tooltip для populated payment.company', async () => {
    mockLists()
    render(<Wrapper companyId={ARCHIVED._id} company={ARCHIVED} />)

    const label = screen.getByText('Архівована')
    expect(document.body).not.toHaveTextContent(ARCHIVED._id)

    await userEvent.hover(label)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('ТОВ Архівна')
  })

  it('знаходить архівну компанію через archived=true, коли company — лише id', () => {
    mockLists([ARCHIVED])
    render(<Wrapper companyId={ARCHIVED._id} company={ARCHIVED._id} />)

    expect(screen.getByText('Архівована')).toBeInTheDocument()
    expect(mockedQuery).toHaveBeenCalledWith(
      { domainId: 'd1', archived: true },
      { skip: false }
    )
  })

  it('показує "Недоступна" замість id, якщо компанію не знайдено', () => {
    mockLists([])
    render(<Wrapper companyId="deleted-company-id" />)

    expect(screen.getByText('Недоступна')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('deleted-company-id')
  })

  it('доступна компанія відображається за назвою без додаткового запиту', () => {
    mockLists([ARCHIVED])
    render(<Wrapper companyId={ACTIVE._id} company={ACTIVE._id} />)

    expect(
      document.querySelector('.ant-select-selection-item')
    ).toHaveTextContent('ТОВ Активна')
    expect(screen.queryByText('Архівована')).toBeNull()
    expect(mockedQuery).toHaveBeenCalledWith(
      { domainId: 'd1', archived: true },
      { skip: true }
    )
  })
})
