import { useAccessibleCustomServices } from './useAccessibleCustomServices'

jest.mock('./customServices.api', () => ({
  useGetCustomServicesQuery: jest.fn(),
}))

import { useGetCustomServicesQuery } from './customServices.api'

const asMock = <T>(fn: T) => fn as unknown as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe('useAccessibleCustomServices', () => {
  it('accessible scope → queries with no domainId (backend auto-scopes)', () => {
    asMock(useGetCustomServicesQuery).mockReturnValue({ data: { data: [] } })

    useAccessibleCustomServices()

    expect(asMock(useGetCustomServicesQuery)).toHaveBeenCalledWith({})
  })

  it('domain scope → queries the given domainId', () => {
    asMock(useGetCustomServicesQuery).mockReturnValue({ data: { data: [] } })

    useAccessibleCustomServices({ kind: 'domain', domainId: 'd1' })

    expect(asMock(useGetCustomServicesQuery)).toHaveBeenCalledWith({
      domainId: 'd1',
    })
  })

  it('domain scope with no id falls back to the accessible query', () => {
    asMock(useGetCustomServicesQuery).mockReturnValue({ data: { data: [] } })

    useAccessibleCustomServices({ kind: 'domain', domainId: undefined })

    expect(asMock(useGetCustomServicesQuery)).toHaveBeenCalledWith({})
  })

  it('exposes services from the response, defaulting to an empty array', () => {
    const items = [{ _id: 's1', name: 'A' }]
    asMock(useGetCustomServicesQuery).mockReturnValue({ data: { data: items } })
    expect(useAccessibleCustomServices().services).toBe(items)

    asMock(useGetCustomServicesQuery).mockReturnValue({ data: undefined })
    expect(useAccessibleCustomServices().services).toEqual([])
  })
})
