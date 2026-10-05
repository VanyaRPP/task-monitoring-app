import '@testing-library/jest-dom'
import { act, render, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import React from 'react'
import { ServiceType } from '@utils/constants'
import { isAreaBasedServiceType } from '@utils/domain/service-type-categories'
import {
  buildTypedCustomColumn,
  getDefaultColumns,
  hasTypedColumn,
} from '@components/Tables/PaymentsBulk/column.config'
import { buildTypedInvoiceEntry } from '@components/Tables/PaymentsBulk/buildTypedInvoiceEntry'

const SERVICE = {
  _id: '6ab0592bace46c818c26379b',
  name: 'Квартплата',
  fieldName: 'kvartplata',
  serviceType: ServiceType.HousingFee,
}
const TARIFF = 12.5
const AREA = 48

const company = {
  _id: 'company-1',
  totalArea: AREA,
  inflicion: true,
  customServices: [
    { _id: SERVICE._id, fieldName: SERVICE.fieldName, price: 0 },
  ],
}
const monthService = {
  customServices: [
    { _id: SERVICE._id, fieldName: SERVICE.fieldName, price: TARIFF },
  ],
}

const mockPaymentContext: { current: any } = {
  current: { company, service: monthService },
}
jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => mockPaymentContext.current,
}))

// eslint-disable-next-line import/first
import HousingFee from '.'

/** Renders a row's Amount + Sum cells over a real form and reads it back. */
const renderRow = async (row: Record<string, unknown>) => {
  let form: any
  const record = { ...row, key: '0' } as any

  const Harness: React.FC = () => {
    const [instance] = Form.useForm()
    form = instance
    return (
      <Form form={instance} initialValues={{ invoice: [row] }}>
        <Form.List name="invoice">
          {() => (
            <>
              <HousingFee.Amount
                form={instance}
                name={0}
                record={record}
                editable
              />
              <HousingFee.Sum form={instance} name={0} record={record} />
            </>
          )}
        </Form.List>
      </Form>
    )
  }

  render(<Harness />)
  await act(async () => {})
  return (field: string) => form.getFieldValue(['invoice', 0, field])
}

describe('Квартплата рахується як Розміщення: м² × тариф', () => {
  it('тип «за площею» з власною колонкою в булку', () => {
    expect(isAreaBasedServiceType(ServiceType.HousingFee)).toBe(true)
    expect(hasTypedColumn(ServiceType.HousingFee)).toBe(true)

    const column: any = buildTypedCustomColumn(SERVICE, { key: SERVICE._id })
    expect(column.title).toBe('Квартплата')
    expect(column.children.map((child: any) => child.title)).toEqual([
      'За м²',
      'Загальне',
    ])
  })

  it('вмикає колонку «Площа, м²» у булку', () => {
    const titles = (getDefaultColumns(jest.fn(), [SERVICE]) as any[]).map(
      (col) => col?.title
    )
    expect(titles).toContain('Площа, м²')
  })

  it('рядок булку: тип квартплати, площа компанії, тариф місяця', () => {
    const entry: any = buildTypedInvoiceEntry({
      customService: SERVICE,
      serviceType: ServiceType.HousingFee,
      company,
      service: monthService,
      prevReading: 0,
    })

    expect(entry).toEqual(
      expect.objectContaining({
        type: ServiceType.HousingFee,
        serviceId: SERVICE._id,
        amount: AREA,
        price: TARIFF,
      })
    )
    expect(entry.lastAmount).toBeUndefined()
  })
})

describe('Квартплата у звичайному рахунку', () => {
  it('рядок із каталогу засівається площею й тарифом і рахує м² × тариф', async () => {
    const read = await renderRow({
      type: ServiceType.HousingFee,
      serviceId: SERVICE._id,
      fieldName: SERVICE.fieldName,
    })

    await waitFor(() => expect(read('sum')).toBe(AREA * TARIFF))
    expect(read('amount')).toBe(AREA)
    expect(read('price')).toBe(TARIFF)
  })

  it('рядок з розрахунку боргу (лише сума) лишається своєю сумою', async () => {
    const read = await renderRow({
      type: ServiceType.HousingFee,
      serviceId: SERVICE._id,
      price: 812.4,
      sum: 812.4,
    })

    await waitFor(() => expect(read('sum')).toBe(812.4))
    expect(read('amount')).toBeUndefined()
  })
})
