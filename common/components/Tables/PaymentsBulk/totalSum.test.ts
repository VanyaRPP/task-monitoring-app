import type { TableColumnsType } from 'antd'
import { calcCompanyTotal } from './totalSum'
import { applyColumnLayout } from './columnLayout'

const invoice = () => ({
  maintenancePrice: { fieldName: 'maintenancePrice', sum: 100 },
  electricityPrice: { fieldName: 'electricityPrice', sum: 50.5 },
  custom1: { fieldName: 'custom1', type: 'custom', sum: 25 },
})

describe('calcCompanyTotal', () => {
  it('sums all invoiced services of the company', () => {
    // electricityPrice — службове поле, яке не потрапляє у generalSum рахунку
    expect(calcCompanyTotal(invoice())).toBe(125)
  })

  it('returns 0 when no services are invoiced', () => {
    expect(calcCompanyTotal({})).toBe(0)
    expect(calcCompanyTotal(undefined)).toBe(0)
    expect(calcCompanyTotal(null)).toBe(0)
    expect(calcCompanyTotal({ a: { sum: 0 }, b: { sum: undefined } })).toBe(0)
  })

  it('recalculates after a service cost changes', () => {
    const inv = invoice()
    expect(calcCompanyTotal(inv)).toBe(125)
    inv.custom1.sum = 75
    expect(calcCompanyTotal(inv)).toBe(175)
    inv.maintenancePrice.sum = 0
    expect(calcCompanyTotal(inv)).toBe(75)
  })

  it('counts hidden columns: hiding is display-only and does not touch the data', () => {
    const inv = invoice()
    const total = calcCompanyTotal(inv)
    const cols = [
      { key: 'maintenance', title: 'M' },
      { key: 'custom1', title: 'C' },
    ] as TableColumnsType

    const visible = applyColumnLayout(
      cols,
      ['maintenance', 'custom1'],
      ['maintenance', 'custom1']
    )
    expect(visible).toHaveLength(0)
    expect(calcCompanyTotal(inv)).toBe(total)
  })
})
