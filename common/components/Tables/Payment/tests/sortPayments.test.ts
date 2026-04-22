import { sortPayments } from '../sortPayments'

const SAME_DATE = '2026-04-21T00:00:00.000Z'

const debit = { _id: '1', type: 'debit', invoiceCreationDate: SAME_DATE } as any
const credit = { _id: '2', type: 'credit', invoiceCreationDate: SAME_DATE } as any
const olderDebit = { _id: '3', type: 'debit', invoiceCreationDate: '2026-04-02T00:00:00.000Z' } as any

describe('sortPayments', () => {
  test('credit перед debit при однаковій даті', () => {
    const result = sortPayments([debit, credit])
    expect(result[0].type).toBe('credit')
    expect(result[1].type).toBe('debit')
  })

  test('новіший платіж вище старішого', () => {
    const result = sortPayments([olderDebit, credit])
    expect(result[0]._id).toBe(credit._id)
    expect(result[1]._id).toBe(olderDebit._id)
  })

  test('повний кейс: credit Apr21 → debit Apr21 → debit Apr02', () => {
    const result = sortPayments([debit, credit, olderDebit])
    expect(result.map((p) => p._id)).toEqual(['2', '1', '3'])
  })
})
