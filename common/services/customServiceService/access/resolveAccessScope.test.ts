import { resolveAccessScope } from './resolveAccessScope'
import type { UserContext } from '../customService.service'

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))

import Domain from '@modules/models/Domain'

const asMock = <T>(fn: T) => fn as unknown as jest.Mock

const mockFind = (docs: any[]) => {
  asMock(Domain.find).mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(docs),
    }),
  })
}

const ctx = (over: Partial<UserContext>): UserContext => ({
  isGlobalAdmin: false,
  isDomainAdmin: false,
  isUser: false,
  user: { email: 'someone@x' },
  ...over,
})

beforeEach(() => jest.clearAllMocks())

describe('resolveAccessScope', () => {
  it('GlobalAdmin → {all} without touching the DB', async () => {
    const scope = await resolveAccessScope(ctx({ isGlobalAdmin: true }))
    expect(scope).toEqual({ kind: 'all' })
    expect(asMock(Domain.find)).not.toHaveBeenCalled()
  })

  it('User → {none} without touching the DB', async () => {
    const scope = await resolveAccessScope(ctx({ isUser: true }))
    expect(scope).toEqual({ kind: 'none' })
    expect(asMock(Domain.find)).not.toHaveBeenCalled()
  })

  it('DomainAdmin → their domain ids + flattened/deduped referenced ids', async () => {
    mockFind([
      {
        _id: 'd1',
        customServices: [{ groupName: 'G', services: ['s1', 's2'] }],
      },
      {
        _id: 'd2',
        customServices: [{ groupName: 'G', services: ['s2', 's3'] }],
      },
    ])

    const scope = await resolveAccessScope(
      ctx({ isDomainAdmin: true, user: { email: 'admin@x' } })
    )

    expect(asMock(Domain.find)).toHaveBeenCalledWith({ adminEmails: 'admin@x' })
    expect(scope).toEqual({
      kind: 'domains',
      domainIds: ['d1', 'd2'],
      referencedServiceIds: ['s1', 's2', 's3'],
    })
  })

  it('DomainAdmin with no owned domains → empty scope (matches nothing)', async () => {
    mockFind([])
    const scope = await resolveAccessScope(
      ctx({ isDomainAdmin: true, user: { email: 'admin@x' } })
    )
    expect(scope).toEqual({
      kind: 'domains',
      domainIds: [],
      referencedServiceIds: [],
    })
  })

  it('tolerates domains with missing/empty customServices', async () => {
    mockFind([{ _id: 'd1' }, { _id: 'd2', customServices: [] }])
    const scope = await resolveAccessScope(
      ctx({ isDomainAdmin: true, user: { email: 'admin@x' } })
    )
    expect(scope).toEqual({
      kind: 'domains',
      domainIds: ['d1', 'd2'],
      referencedServiceIds: [],
    })
  })
})
