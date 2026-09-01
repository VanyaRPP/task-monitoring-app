import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { EditInvoicesTable_unstable } from './index'

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({
    data: { data: [] },
    isLoading: false,
  }),
}))

const Wrapper = ({ editable = true }: { editable?: boolean }) => {
  const [form] = Form.useForm()
  return (
    <Form form={form}>
      <EditInvoicesTable_unstable
        form={form}
        editable={editable}
        domainId="d1"
      />
    </Form>
  )
}

describe('EditInvoicesTable — порожній стан', () => {
  it('показує підказку як додати послугу, коли рядків немає і таблиця редагована', () => {
    render(<Wrapper editable />)

    expect(screen.getByText(/Ще немає послуг/)).toBeInTheDocument()
  })

  it('не показує підказку, коли таблиця нередагована', () => {
    render(<Wrapper editable={false} />)

    expect(screen.queryByText(/Ще немає послуг/)).not.toBeInTheDocument()
  })
})
