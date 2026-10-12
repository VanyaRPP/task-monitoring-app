import { CompanyDisplayStatus, resolveCompanyDisplay } from './companyDisplay'

const active = { _id: 'c-active', companyName: 'ТОВ Активна' }
const archived = {
  _id: 'c-archived',
  companyName: 'ТОВ Архівна',
  archived: true,
}

describe('resolveCompanyDisplay', () => {
  it('returns null when nothing is selected', () => {
    expect(resolveCompanyDisplay(null, [active])).toBeNull()
    expect(resolveCompanyDisplay(undefined, [active])).toBeNull()
    expect(resolveCompanyDisplay('', [active])).toBeNull()
  })

  it('shows an available company by name', () => {
    expect(resolveCompanyDisplay('c-active', [active], [archived])).toEqual({
      status: CompanyDisplayStatus.Active,
      name: 'ТОВ Активна',
    })
  })

  it('marks a company from the archived list as archived, keeping its name for the tooltip', () => {
    expect(resolveCompanyDisplay('c-archived', [active], [archived])).toEqual({
      status: CompanyDisplayStatus.Archived,
      name: 'ТОВ Архівна',
    })
  })

  it('treats an archived company that is still in the active list as archived', () => {
    expect(resolveCompanyDisplay('c-archived', [archived])).toEqual({
      status: CompanyDisplayStatus.Archived,
      name: 'ТОВ Архівна',
    })
  })

  it('shows a known non-archived company outside the option list by name', () => {
    // e.g. a populated payment.company filtered out by the street filter
    expect(
      resolveCompanyDisplay(
        'c-other',
        [active],
        [{ _id: 'c-other', companyName: 'ТОВ Інша вулиця' }]
      )
    ).toEqual({
      status: CompanyDisplayStatus.Active,
      name: 'ТОВ Інша вулиця',
    })
  })

  it('reports an unknown company as unavailable and never exposes its id', () => {
    const display = resolveCompanyDisplay('64ff47a2a6ce612394047226', [active])
    expect(display).toEqual({ status: CompanyDisplayStatus.Unavailable })
    expect(JSON.stringify(display)).not.toContain('64ff47a2a6ce612394047226')
  })

  it('compares ObjectId-like ids by their string value', () => {
    const objectId = { toString: () => 'c-archived' }
    expect(resolveCompanyDisplay(objectId, [], [archived])?.status).toBe(
      CompanyDisplayStatus.Archived
    )
  })
})
