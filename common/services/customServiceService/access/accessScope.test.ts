import mongoose from 'mongoose'
import {
  AccessScope,
  buildServiceFilter,
  ServiceFilterRequest,
} from './accessScope'

const oid = () => new mongoose.Types.ObjectId().toString()

const req = (
  over: Partial<ServiceFilterRequest> = {}
): ServiceFilterRequest => ({
  domainId: null,
  ids: null,
  categoryDefaultIds: null,
  ...over,
})

const all: AccessScope = { kind: 'all' }
const none: AccessScope = { kind: 'none' }

describe('buildServiceFilter', () => {
  describe('none scope (User / no admin role)', () => {
    it('is always forbidden, whatever the request', () => {
      expect(buildServiceFilter(none, req())).toEqual({
        ok: false,
        code: 'forbidden',
      })
      expect(buildServiceFilter(none, req({ domainId: oid() }))).toEqual({
        ok: false,
        code: 'forbidden',
      })
    })
  })

  describe('explicit ids', () => {
    it('short-circuits to empty when ids is present but empty', () => {
      expect(buildServiceFilter(all, req({ ids: [] }))).toEqual({
        ok: false,
        code: 'empty',
      })
    })

    it('keeps ids as strings and merges them flatly with the domain clause', () => {
      const id = oid()
      const domainId = oid()
      const result = buildServiceFilter(all, req({ domainId, ids: [id] }))
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.filter._id).toEqual({ $in: [id] })
        expect(Array.isArray(result.filter.$or)).toBe(true)
      }
    })
  })

  describe('GlobalAdmin (all)', () => {
    it('no domainId → empty filter (whole catalog)', () => {
      const result = buildServiceFilter(all, req())
      expect(result).toEqual({ ok: true, filter: {} })
    })

    it('domainId without category → legacy union of 3 clauses', () => {
      const result = buildServiceFilter(all, req({ domainId: oid() }))
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.filter.$or).toHaveLength(3)
      }
    })

    it('domainId + category with defaults → domain + defaults', () => {
      const result = buildServiceFilter(
        all,
        req({ domainId: oid(), categoryDefaultIds: [oid()] })
      )
      expect(result.ok).toBe(true)
      if (result.ok) {
        const or = result.filter.$or as any[]
        expect(or).toHaveLength(2)
        expect(or[0]).toEqual({ domain: expect.anything() })
        expect(or[1]).toEqual({ _id: { $in: expect.any(Array) } })
      }
    })

    it('domainId + category with no defaults → just the domain clause', () => {
      const result = buildServiceFilter(
        all,
        req({ domainId: oid(), categoryDefaultIds: [] })
      )
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.filter.$or).toHaveLength(1)
      }
    })
  })

  describe('DomainAdmin (domains)', () => {
    const d1 = oid()
    const d2 = oid()
    const ref = oid()
    const scope: AccessScope = {
      kind: 'domains',
      domainIds: [d1, d2],
      referencedServiceIds: [ref],
    }

    it('auto-scopes to the union of all their domains + referenced services', () => {
      const result = buildServiceFilter(scope, req())
      expect(result.ok).toBe(true)
      if (result.ok) {
        const or = result.filter.$or as any[]
        expect(or).toHaveLength(2)
        // domain ∈ {d1, d2}
        expect(or[0].domain.$in).toHaveLength(2)
        // referenced shared services
        expect(or[1]).toEqual({ _id: { $in: expect.any(Array) } })
      }
    })

    it('auto-scope without referenced services → single domain clause', () => {
      const result = buildServiceFilter(
        { kind: 'domains', domainIds: [d1], referencedServiceIds: [] },
        req()
      )
      expect(result.ok).toBe(true)
      if (result.ok) {
        const or = result.filter.$or as any[]
        expect(or).toHaveLength(1)
        expect(or[0].domain.$in).toHaveLength(1)
      }
    })

    it('requested domainId they administer → only that domain, no legacy pool', () => {
      const result = buildServiceFilter(scope, req({ domainId: d1 }))
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.filter).toEqual({ domain: expect.anything() })
        expect(result.filter.$or).toBeUndefined()
      }
    })

    it('requested domainId they do NOT administer → forbidden (no leak)', () => {
      const result = buildServiceFilter(scope, req({ domainId: oid() }))
      expect(result).toEqual({ ok: false, code: 'forbidden' })
    })

    it('own domainId + category → own domain + shared defaults', () => {
      const result = buildServiceFilter(
        scope,
        req({ domainId: d1, categoryDefaultIds: [oid()] })
      )
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.filter.$or).toHaveLength(2)
      }
    })
  })
})
