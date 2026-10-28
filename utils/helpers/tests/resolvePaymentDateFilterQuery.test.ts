import { resolvePaymentDateFilterQuery } from '@utils/helpers'

describe('resolvePaymentDateFilterQuery()', () => {
  it('за замовчуванням фільтрує за invoiceCreationDate, якщо фільтри відсутні', () => {
    expect(resolvePaymentDateFilterQuery(undefined)).toEqual({
      dateField: 'invoiceCreationDate',
    })
  })

  it('фільтрує за invoiceCreationDate, коли задано лише дату створення', () => {
    const result = resolvePaymentDateFilterQuery({
      invoiceCreationDate: ['2026-month-3'],
    })

    expect(result).toEqual({
      dateField: 'invoiceCreationDate',
      year: 2026,
      month: 3,
    })
  })

  it('фільтрує за monthService (dateField: "date"), коли задано місяць надання послуг', () => {
    const result = resolvePaymentDateFilterQuery({
      monthService: ['2026-month-5'],
    })

    expect(result).toEqual({
      dateField: 'date',
      year: 2026,
      month: 5,
    })
  })

  it('надає пріоритет monthService, якщо задано обидва фільтри одночасно', () => {
    const result = resolvePaymentDateFilterQuery({
      invoiceCreationDate: ['2025-month-1'],
      monthService: ['2026-month-7'],
    })

    expect(result).toEqual({
      dateField: 'date',
      year: 2026,
      month: 7,
    })
  })

  it('підтримує вибір кількох місяців для monthService', () => {
    const result = resolvePaymentDateFilterQuery({
      monthService: ['2026-month-1', '2026-month-2'],
    })

    expect(result.dateField).toBe('date')
    expect(result.year).toBe(2026)
    expect(Array.isArray(result.month)).toBe(true)
    expect(result.month).toContain(1)
    expect(result.month).toContain(2)
  })

  it('додає межі довільного проміжку дат до запиту', () => {
    const result = resolvePaymentDateFilterQuery({
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })

    expect(result.dateField).toBe('invoiceCreationDate')
    expect(new Date(result.dateFrom).getDate()).toBe(1)
    expect(new Date(result.dateTo).getDate()).toBe(28)
    expect(new Date(result.dateTo).getMonth()).toBe(8)
  })

  it('поєднує проміжок дат із фільтром за місяцем послуг', () => {
    const result = resolvePaymentDateFilterQuery({
      monthService: ['2026-month-7'],
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })

    expect(result).toMatchObject({ dateField: 'date', year: 2026, month: 7 })
    expect(result.dateFrom).toBeDefined()
    expect(result.dateTo).toBeDefined()
  })

  it('фільтрує лише за роком, коли місяць не обрано', () => {
    const result = resolvePaymentDateFilterQuery({
      monthService: ['2026'],
    })

    expect(result).toEqual({
      dateField: 'date',
      year: 2026,
    })
  })
})
