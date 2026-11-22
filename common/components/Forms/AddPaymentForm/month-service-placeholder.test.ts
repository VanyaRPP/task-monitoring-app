import dayjs from 'dayjs'

import {
  buildMonthServicePlaceholder,
  buildPreviewMonthService,
} from './month-service-placeholder'

describe('buildPreviewMonthService', () => {
  it('returns { _id, date } when id is known and service is loaded', () => {
    const result = buildPreviewMonthService({
      monthServiceId: 'abc123',
      service: { date: '2026-09-01T00:00:00.000Z' },
    })

    expect(result).toEqual({
      _id: 'abc123',
      date: '2026-09-01T00:00:00.000Z',
    })
  })

  it('takes the date from the placeholder when service is not loaded', () => {
    const placeholder = buildMonthServicePlaceholder(dayjs('2026-09-15'))

    const result = buildPreviewMonthService({ placeholder })

    expect(result).toBeDefined()
    expect(dayjs(result?.date).year()).toBe(2026)
    expect(dayjs(result?.date).month()).toBe(8) // вересень, місяці з 0
  })

  it('keeps the resolved id together with the placeholder date', () => {
    const placeholder = buildMonthServicePlaceholder(dayjs('2026-09-15'))

    const result = buildPreviewMonthService({
      monthServiceId: 'abc123',
      placeholder,
    })

    expect(result?._id).toBe('abc123')
    expect(dayjs(result?.date).month()).toBe(8)
  })

  it('returns undefined when nothing is known', () => {
    expect(buildPreviewMonthService({})).toBeUndefined()
  })
})
