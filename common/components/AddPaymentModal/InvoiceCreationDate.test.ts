import dayjs from 'dayjs'

describe('invoiceCreationDate time creation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-04-27T16:15:15.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const createInvoiceCreationDate = (formData: any) => {
    return formData.invoiceCreationDate
      ? (() => {
          const now = new Date()

          return new Date(
            Date.UTC(
              formData.invoiceCreationDate.year(),
              formData.invoiceCreationDate.month(),
              formData.invoiceCreationDate.date(),
              now.getUTCHours(),
              now.getUTCMinutes(),
              now.getUTCSeconds(),
              now.getUTCMilliseconds()
            )
          )
        })()
      : new Date()
  }

  it('should use selected date and current time', () => {
    const formData = {
      invoiceCreationDate: dayjs('2026-04-27'),
    }

    const result = createInvoiceCreationDate(formData)

    expect(result.getUTCFullYear()).toBe(2026)
    expect(result.getUTCMonth()).toBe(3)
    expect(result.getUTCDate()).toBe(27)

    expect(result.getUTCHours()).toBe(16)
    expect(result.getUTCMinutes()).toBe(15)
    expect(result.getUTCSeconds()).toBe(15)
  })

  it('should use current date and time when invoiceCreationDate is empty', () => {
    const formData = {
      invoiceCreationDate: null,
    }

    const result = createInvoiceCreationDate(formData)

    expect(result.toISOString()).toBe(
      new Date('2026-04-27T16:15:15.000Z').toISOString()
    )
  })
})
