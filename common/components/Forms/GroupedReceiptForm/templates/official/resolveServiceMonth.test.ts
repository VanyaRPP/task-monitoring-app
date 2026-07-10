import { resolveServiceMonth } from './resolveServiceMonth'

describe('resolveServiceMonth', () => {
  it('повертає date з monthService якщо він обʼєкт з date', () => {
    const date = new Date('2024-03-01')
    expect(resolveServiceMonth({ date }, undefined)).toBe(date)
  })

  it('повертає invoiceCreationDate якщо monthService — рядок (id)', () => {
    const fallback = new Date('2024-05-01')
    expect(resolveServiceMonth('service-id-123', fallback)).toBe(fallback)
  })

  it('повертає invoiceCreationDate якщо monthService — null', () => {
    const fallback = '2024-05-01'
    expect(resolveServiceMonth(null, fallback)).toBe(fallback)
  })

  it('повертає invoiceCreationDate якщо monthService — обʼєкт без date', () => {
    const fallback = new Date('2024-01-01')
    expect(resolveServiceMonth({ _id: 'abc' }, fallback)).toBe(fallback)
  })

  it('повертає invoiceCreationDate якщо monthService — undefined', () => {
    const fallback = new Date('2024-06-01')
    expect(resolveServiceMonth(undefined, fallback)).toBe(fallback)
  })

  it('повертає undefined якщо обидва не задані', () => {
    expect(resolveServiceMonth(undefined, undefined)).toBeUndefined()
  })
})
