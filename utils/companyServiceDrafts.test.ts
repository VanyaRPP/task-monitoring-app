import {
  createDraftServiceEntry,
  DEFAULT_DRAFT_SERVICE_NAME,
  DRAFT_SERVICE_ID_PREFIX,
  getDraftServiceNameError,
  isDraftServiceEntry,
} from './companyServiceDrafts'

describe('createDraftServiceEntry', () => {
  it('starts as an unpriced "Нова послуга" draft with a temporary id', () => {
    const draft = createDraftServiceEntry()

    expect(draft).toMatchObject({
      label: DEFAULT_DRAFT_SERVICE_NAME,
      price: null,
      isDraft: true,
    })
    expect(draft._id.startsWith(DRAFT_SERVICE_ID_PREFIX)).toBe(true)
  })

  it('gives every draft its own id, so several can live in one modal', () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => createDraftServiceEntry()._id)
    )
    expect(ids.size).toBe(50)
  })
})

describe('isDraftServiceEntry', () => {
  it('recognises only entries flagged as drafts', () => {
    expect(isDraftServiceEntry(createDraftServiceEntry())).toBe(true)
    expect(
      isDraftServiceEntry({ _id: 'svc-1', label: 'Ліфт', price: 10 })
    ).toBe(false)
    expect(isDraftServiceEntry({ isDraft: 'true' })).toBe(false)
    expect(isDraftServiceEntry(null)).toBe(false)
    expect(isDraftServiceEntry(undefined)).toBe(false)
  })
})

describe('getDraftServiceNameError', () => {
  it('accepts a new, non-empty name', () => {
    expect(getDraftServiceNameError('Охорона', ['Ліфт'])).toBeNull()
  })

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['not a string', undefined],
  ])('rejects an %s name', (_, name) => {
    expect(getDraftServiceNameError(name)).toBe('Вкажіть назву послуги')
  })

  it('rejects the placeholder name in any case or padding', () => {
    expect(getDraftServiceNameError(DEFAULT_DRAFT_SERVICE_NAME)).toBe(
      'Змініть назву послуги'
    )
    expect(getDraftServiceNameError('  нова ПОСЛУГА ')).toBe(
      'Змініть назву послуги'
    )
  })

  it('rejects a name that is already taken, ignoring case and spaces', () => {
    expect(getDraftServiceNameError(' ліфт ', ['Ліфт'])).toBe(
      'Послуга з такою назвою вже існує'
    )
  })
})
