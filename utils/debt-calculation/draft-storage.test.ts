import {
  clearDraft,
  draftKey,
  isDraftNewer,
  readDraft,
  writeDraft,
} from './draft-storage'

const KEY = draftKey('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')

beforeEach(() => {
  window.localStorage.clear()
})

describe('draftKey', () => {
  it('склеює домен і квартиру', () => {
    expect(KEY).toBe(
      'debt-calculation:507f1f77bcf86cd799439011:507f1f77bcf86cd799439012'
    )
  })

  it('порожній, поки не обрано обидва', () => {
    expect(draftKey('a')).toBe('')
    expect(draftKey(undefined, 'b')).toBe('')
    expect(draftKey()).toBe('')
  })
})

describe('readDraft / writeDraft / clearDraft', () => {
  it('повертає записане разом із міткою часу', () => {
    writeDraft(KEY, { annualRatePercent: 3 })

    const draft = readDraft(KEY)
    expect(draft.snapshot).toEqual({ annualRatePercent: 3 })
    expect(Number.isFinite(Date.parse(draft.at))).toBe(true)
  })

  it('null, коли нічого не писали', () => {
    expect(readDraft(KEY)).toBeNull()
  })

  it('null на порожньому ключі — не чіпає сховище', () => {
    writeDraft('', { annualRatePercent: 3 })

    expect(readDraft('')).toBeNull()
    expect(window.localStorage.length).toBe(0)
  })

  it('null на побитому JSON, а не виняток', () => {
    window.localStorage.setItem(KEY, 'не json')

    expect(readDraft(KEY)).toBeNull()
  })

  it('null на записі без очікуваних полів', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ щось: 'інше' }))

    expect(readDraft(KEY)).toBeNull()
  })

  it('прибирає чернетку', () => {
    writeDraft(KEY, { annualRatePercent: 3 })
    clearDraft(KEY)

    expect(readDraft(KEY)).toBeNull()
  })

  it('не падає, коли сховище кидає виняток', () => {
    const spy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

    expect(() => writeDraft(KEY, { annualRatePercent: 3 })).not.toThrow()

    spy.mockRestore()
  })

  it('не падає, коли читання заблоковане', () => {
    const spy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('SecurityError')
      })

    expect(readDraft(KEY)).toBeNull()

    spy.mockRestore()
  })
})

describe('isDraftNewer', () => {
  const draft = { snapshot: {}, at: '2026-09-23T12:00:00.000Z' }

  it('чернетка новіша за збережене — беремо її', () => {
    expect(isDraftNewer(draft, '2026-09-23T11:00:00.000Z')).toBe(true)
  })

  it('база новіша — беремо базу', () => {
    expect(isDraftNewer(draft, '2026-09-23T13:00:00.000Z')).toBe(false)
  })

  it('однаковий час — беремо базу', () => {
    expect(isDraftNewer(draft, '2026-09-23T12:00:00.000Z')).toBe(false)
  })

  it('немає чернетки — нема про що говорити', () => {
    expect(isDraftNewer(null, '2026-09-23T11:00:00.000Z')).toBe(false)
  })

  it('немає збереженого — чернетка виграє', () => {
    expect(isDraftNewer(draft, null)).toBe(true)
    expect(isDraftNewer(draft, undefined)).toBe(true)
  })

  it('нерозбірна мітка чернетки програє збереженому', () => {
    expect(
      isDraftNewer({ snapshot: {}, at: 'вчора' }, '2026-09-23T11:00:00.000Z')
    ).toBe(false)
  })

  it('але коли в базі порожньо — чернетка все одно виграє', () => {
    // The only data there is. Discarding it over a broken stamp would wipe
    // someone's work for no reason.
    expect(isDraftNewer({ snapshot: {}, at: 'вчора' }, null)).toBe(true)
  })

  it('нерозбірна дата збереження поступається чернетці', () => {
    expect(isDraftNewer(draft, 'колись')).toBe(true)
  })
})
