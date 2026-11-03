import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Form, FormInstance } from 'antd'
import AddServiceForm from './index'

const catalog = [
  {
    groupName: 'Комунальні',
    services: [
      { _id: 'svc-el', name: 'Електроенергія', fieldName: 'electricityPrice' },
      { _id: 'svc-water', name: 'Водопостачання', fieldName: 'waterPrice' },
      { _id: 'svc-infl', name: 'Інфляція', fieldName: 'inflicionPrice' },
      { _id: 'svc-lift', name: 'Ліфт', fieldName: 'lift' },
    ],
  },
]

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({ data: { data: catalog } }),
}))
jest.mock('@common/api/inflationIndexApi/inflationIndex.api', () => ({
  useGetInflationIndexesQuery: () => ({
    data: [{ year: 2026, month: 10, value: 101.2 }],
  }),
}))
jest.mock('@modules/hooks/useService', () => ({
  usePreviousMonthService: () => ({ previousMonth: undefined }),
}))
// Pickers and cards are not under test; the form values are.
jest.mock('@components/UI/Reusable/DomainsSelect', () => () => null)
jest.mock('@components/UI/Reusable/AddressesSelect', () => () => null)
jest.mock('@components/UI/CustomServicesCard', () => () => null)
jest.mock('@components/Losses/LossesCollapse', () => ({
  LossesCollapse: () => null,
}))

function renderWith(props: Record<string, unknown>) {
  let instance: FormInstance
  const Wrapper = () => {
    const [form] = Form.useForm()
    instance = form
    return (
      <AddServiceForm
        form={form}
        edit={false}
        currentService={undefined}
        setIsValueChanged={jest.fn()}
        {...props}
      />
    )
  }
  render(<Wrapper />)
  return () => instance
}

const priceOf = (rows: any[], fieldName: string) =>
  rows?.find((row) => row.fieldName === fieldName)?.price

describe('AddServiceForm with a draft', () => {
  it("fills the catalog rows with the draft's prices", async () => {
    const form = renderWith({
      draft: {
        domain: { _id: 'dom-1' },
        date: '2026-10-01T12:00:00.000Z',
        customServices: [],
        electricityPrice: 4.32,
        waterPrice: 30,
        lift: 12,
      },
    })

    await waitFor(() =>
      expect(form().getFieldValue('customServices')?.length).toBe(4)
    )
    const rows = form().getFieldValue('customServices')
    expect(priceOf(rows, 'electricityPrice')).toBe(4.32)
    expect(priceOf(rows, 'waterPrice')).toBe(30)
    expect(priceOf(rows, 'lift')).toBe(12)
    expect(form().getFieldValue('domain')).toBe('dom-1')
  })

  it("takes the month's inflation index when the draft names none", async () => {
    const form = renderWith({
      draft: {
        domain: { _id: 'dom-1' },
        date: '2026-10-01T12:00:00.000Z',
        customServices: [],
        electricityPrice: 4.32,
      },
    })

    await waitFor(() =>
      expect(
        priceOf(form().getFieldValue('customServices'), 'inflicionPrice')
      ).toBe(101.2)
    )
  })
})
