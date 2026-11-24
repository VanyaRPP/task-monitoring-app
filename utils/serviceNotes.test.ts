import { findServiceNote } from './serviceNotes'

const company = {
  customServices: [
    { _id: 'a', label: 'A', fieldName: 'fa', price: 1, note: 'Note A' },
    { _id: 'b', label: 'B', fieldName: 'fb', price: 1, note: '   ' },
    { _id: 'c', label: 'C', fieldName: 'fc', price: 1 },
  ],
}

describe('findServiceNote', () => {
  it('finds a note by service id', () => {
    expect(findServiceNote(company, { serviceId: 'a' })).toBe('Note A')
  })

  it('falls back to fieldName', () => {
    expect(findServiceNote(company, { fieldName: 'fa' })).toBe('Note A')
  })

  it('returns undefined for blank, missing or unknown notes', () => {
    expect(findServiceNote(company, { serviceId: 'b' })).toBeUndefined()
    expect(findServiceNote(company, { serviceId: 'c' })).toBeUndefined()
    expect(findServiceNote(company, { serviceId: 'zzz' })).toBeUndefined()
    expect(findServiceNote(null, { serviceId: 'a' })).toBeUndefined()
    expect(findServiceNote({}, { serviceId: 'a' })).toBeUndefined()
  })
})
