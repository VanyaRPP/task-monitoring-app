import { applyInflationDefault } from './service-defaults'

const rent = { fieldName: 'rentPrice', price: 25 }
const inflation = (price: number | null) => ({
  fieldName: 'inflicionPrice',
  price,
})

describe('applyInflationDefault', () => {
  it('підставляє індекс з довідника в порожній рядок', () => {
    expect(applyInflationDefault([rent, inflation(0)], 100.4, null)).toEqual([
      rent,
      inflation(100.4),
    ])
  })

  it('місяця немає в довіднику — рядок лишається порожнім, а не 100', () => {
    expect(applyInflationDefault([inflation(null)], null, null)).toEqual([
      inflation(null),
    ])
  })

  it('інший місяць: замінює власну підстановку', () => {
    expect(applyInflationDefault([inflation(100.4)], 101.1, 100.4)).toEqual([
      inflation(101.1),
    ])
  })

  it('інший місяць без індексу: прибирає власну підстановку', () => {
    expect(applyInflationDefault([inflation(100.4)], null, 100.4)).toEqual([
      inflation(null),
    ])
  })

  it('не чіпає значення, вписане руками', () => {
    const rows = [inflation(102)]

    expect(applyInflationDefault(rows, 100.4, 101.1)).toBe(rows)
  })

  it('повертає той самий масив, коли нічого не змінилося', () => {
    const rows = [rent, inflation(100.4)]

    expect(applyInflationDefault(rows, 100.4, 100.4)).toBe(rows)
    expect(applyInflationDefault([rent], 100.4, null)).toEqual([rent])
  })
})
