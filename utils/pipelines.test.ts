import { getRealEstatesPipeline } from './pipelines'

const base = {
  isGlobalAdmin: true,
  distinctedDomainsIds: [],
  distinctedStreetsIds: [],
  group: 'company',
}

describe('getRealEstatesPipeline — archived filter', () => {
  it('adds an "archived: true" match stage when archived is true', () => {
    const pipeline = getRealEstatesPipeline({ ...base, archived: true })
    expect(pipeline).toContainEqual({
      $match: { 'companyDetails.archived': true },
    })
  })

  it('adds an "archived: true" match stage when archived is the string "true"', () => {
    const pipeline = getRealEstatesPipeline({ ...base, archived: 'true' })
    expect(pipeline).toContainEqual({
      $match: { 'companyDetails.archived': true },
    })
  })

  it('adds a "not archived" match stage when archived is false', () => {
    const pipeline = getRealEstatesPipeline({ ...base, archived: false })
    expect(pipeline).toContainEqual({
      $match: { 'companyDetails.archived': { $ne: true } },
    })
  })

  it('adds a "not archived" match stage when archived is the string "false"', () => {
    const pipeline = getRealEstatesPipeline({ ...base, archived: 'false' })
    expect(pipeline).toContainEqual({
      $match: { 'companyDetails.archived': { $ne: true } },
    })
  })

  it('adds no archived-related stage when archived is omitted', () => {
    const pipeline = getRealEstatesPipeline({ ...base, archived: undefined })
    const archivedStages = pipeline.filter(
      (stage: any) => stage.$match && 'companyDetails.archived' in stage.$match
    )
    expect(archivedStages).toHaveLength(0)
  })
})
