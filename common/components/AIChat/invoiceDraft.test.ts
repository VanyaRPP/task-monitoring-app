import dayjs from 'dayjs'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import { toPaymentFormData } from './invoiceDraft'

describe('toPaymentFormData', () => {
  it('turns a month without a Service into the placeholder the month select offers', () => {
    const form = toPaymentFormData({
      company: 'co-1',
      monthService: null,
      period: { year: 2026, month: 3 },
    })

    // MonthServiceSelect builds its options the same way; an exact match is
    // what keeps the select on March instead of resetting to the newest month.
    expect(form.monthService).toBe(
      buildMonthServicePlaceholder(dayjs('2026-03-15'))
    )
    expect(form).not.toHaveProperty('period')
    expect(form.company).toBe('co-1')
  })

  it('keeps an existing Service id', () => {
    const form = toPaymentFormData({
      monthService: 'svc-1',
      period: { year: 2026, month: 3 },
    })

    expect(form.monthService).toBe('svc-1')
    expect(form).not.toHaveProperty('period')
  })
})
