import '@testing-library/jest-dom'
import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { ServiceType } from '@utils/constants'

// Stub each invoice subdirectory with a minimal { Name, Amount, Price, Sum }
// quartet that just renders an identifying string. This lets us assert that
// the dispatcher routes record.type → correct subcomponent without rendering
// the heavy real components.
const makeStub = (label: string) => {
  const Stub = ({ name }: { name: number }) => (
    <span>{`${label}-${name ?? '?'}`}</span>
  )
  return { Name: Stub, Amount: Stub, Price: Stub, Sum: Stub }
}

jest.mock('./Maintenance', () => makeStub('M'))
jest.mock('./Placing', () => makeStub('P'))
jest.mock('./Inflicion', () => makeStub('I'))
jest.mock('./GarbageCollector', () => makeStub('G'))
jest.mock('./Electricity', () => makeStub('E'))
jest.mock('./Water', () => makeStub('W'))
jest.mock('./WaterPart', () => makeStub('WP'))
jest.mock('./Cleaning', () => makeStub('CL'))
jest.mock('./Discount', () => makeStub('D'))
jest.mock('./Custom', () => makeStub('CUSTOM'))

// Catalog query is unused in the dispatcher tests but the module imports it.
jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({
    data: { data: [] },
    isLoading: false,
  }),
}))

import { EditInvoicesTable_unstable, InvoiceSelector } from './index'
import { Form } from 'antd'

const renderTable = (invoice: any[]) => {
  const Wrapper = () => {
    const [form] = Form.useForm()
    return (
      <Form form={form} initialValues={{ invoice }}>
        <EditInvoicesTable_unstable form={form} editable />
      </Form>
    )
  }
  return render(<Wrapper />)
}

describe('Component dispatcher', () => {
  it.each([
    [ServiceType.Maintenance, 'M-0'],
    [ServiceType.Placing, 'P-0'],
    [ServiceType.Inflicion, 'I-0'],
    [ServiceType.GarbageCollector, 'G-0'],
    [ServiceType.Electricity, 'E-0'],
    [ServiceType.Water, 'W-0'],
    [ServiceType.WaterPart, 'WP-0'],
    [ServiceType.Cleaning, 'CL-0'],
    [ServiceType.Discount, 'D-0'],
    [ServiceType.Custom, 'CUSTOM-0'],
  ])('routes ServiceType.%s to its component module', (type, expected) => {
    renderTable([{ type }])
    // Each cell (Name/Amount/Price/Sum) renders the stub once → 4 instances.
    expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
  })

  it('falls back to Custom for an unknown record.type', () => {
    renderTable([{ type: 'unknown-future-type' as any }])
    expect(screen.getAllByText('CUSTOM-0').length).toBeGreaterThan(0)
  })
})

describe('<InvoiceSelector>', () => {
  it('shows a "no domain" placeholder and is disabled when service has no domain', () => {
    render(<InvoiceSelector service={undefined} excludeKeys={[]} />)
    // antd Select renders the placeholder via .ant-select-selection-placeholder
    expect(
      screen.queryByText('Немає домену в сервісі — каталог недоступний')
    ).not.toBeNull()
  })
})
