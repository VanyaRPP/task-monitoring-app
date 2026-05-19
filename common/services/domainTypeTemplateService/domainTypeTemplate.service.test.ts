import { getDefaultServiceIdsForCategory } from './domainTypeTemplate.service'

const selectMock = jest.fn()
const findMock = jest.fn()

jest.mock('@modules/models/domain-type-template', () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => findMock(...args),
  },
  DomainTypeTemplateCategory: {},
  DOMAIN_TYPE_TEMPLATE_CATEGORIES: [],
}))

beforeEach(() => {
  jest.clearAllMocks()
  findMock.mockReturnValue({
    select: selectMock.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
  })
})

describe('getDefaultServiceIdsForCategory', () => {
  it('queries only built-in, non-archived templates of the requested category', async () => {
    await getDefaultServiceIdsForCategory('utility' as any)
    expect(findMock).toHaveBeenCalledWith({
      isBuiltIn: true,
      category: 'utility',
      archivedAt: null,
    })
  })

  it('returns a deduplicated union of serviceIds across all matching templates', async () => {
    findMock.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            groups: [
              { serviceIds: ['a', 'b'] },
              { serviceIds: ['c'] },
            ],
          },
          { groups: [{ serviceIds: ['b', 'd'] }] },
        ]),
      }),
    })

    const ids = await getDefaultServiceIdsForCategory('utility' as any)
    expect(ids.sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns an empty array when no templates match', async () => {
    const ids = await getDefaultServiceIdsForCategory('auto' as any)
    expect(ids).toEqual([])
  })

  it('tolerates templates with missing groups or serviceIds', async () => {
    findMock.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { groups: null },
          { groups: [{}] },
          { groups: [{ serviceIds: null }] },
          { groups: [{ serviceIds: ['x'] }] },
        ]),
      }),
    })
    const ids = await getDefaultServiceIdsForCategory('it' as any)
    expect(ids).toEqual(['x'])
  })
})
