import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { realEstates, users } from '@utils/testData'
import listHandler from '..'
import itemHandler from '../[id]'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const call = async (handler: any, req: any) => {
  const res = { status: jest.fn(() => res), json: jest.fn() } as any
  await handler(req, res)
  return { status: res.status, body: res.json.mock.lastCall?.[0] }
}

const patch = (id: string, customServices: unknown[], extra = {}) =>
  call(itemHandler, {
    method: 'PATCH',
    query: { id },
    body: { customServices, ...extra },
  })

const getCompanies = (query = {}) => call(listHandler, { method: 'GET', query })

const entry = (note?: string) => ({
  _id: '677d414283b6ef93c6b8ea2c',
  label: 'Service',
  fieldName: 'custom_field',
  price: 10,
  ...(note !== undefined && { note }),
})

describe('Company service notes', () => {
  const own = realEstates.find(
    (c) => !c.archived && c.adminEmails.includes(users.user.email)
  )
  const foreign = realEstates.find(
    (c) => !c.archived && !c.adminEmails.includes(users.user.email)
  )

  it('saves, returns, edits and clears a note', async () => {
    await mockLoginAs(users.globalAdmin)

    await patch(own._id, [entry('Line 1\nLine 2')])
    let res = await getCompanies({ companyId: own._id })
    expect(res.body.data[0].customServices[0].note).toBe('Line 1\nLine 2')

    await patch(own._id, [entry('Updated')])
    res = await getCompanies({ companyId: own._id })
    expect(res.body.data[0].customServices[0].note).toBe('Updated')

    await patch(own._id, [entry('')])
    res = await getCompanies({ companyId: own._id })
    expect(res.body.data[0].customServices[0].note).toBe('')
  })

  it('defaults to an empty note when none is provided', async () => {
    await mockLoginAs(users.globalAdmin)
    await patch(own._id, [entry()])
    const res = await getCompanies({ companyId: own._id })
    expect(res.body.data[0].customServices[0].note).toBe('')
  })

  it('keeps notes of the same service separate between companies', async () => {
    await mockLoginAs(users.globalAdmin)
    await patch(own._id, [entry('Note for A')])
    await patch(foreign._id, [entry('Note for B')])

    const a = await getCompanies({ companyId: own._id })
    const b = await getCompanies({ companyId: foreign._id })

    expect(a.body.data[0].customServices[0].note).toBe('Note for A')
    expect(b.body.data[0].customServices[0].note).toBe('Note for B')
  })

  it("does not expose another company's notes to a regular user", async () => {
    await mockLoginAs(users.globalAdmin)
    await patch(own._id, [entry('Mine')])
    await patch(foreign._id, [entry('Secret of B')])

    await mockLoginAs(users.user)
    const res = await getCompanies({})
    const ids = res.body.data.map((c: any) => String(c._id))

    expect(ids).toContain(String(own._id))
    expect(ids).not.toContain(String(foreign._id))
    expect(JSON.stringify(res.body)).not.toContain('Secret of B')

    const direct = await getCompanies({ companyId: foreign._id })
    expect(direct.body.data).toHaveLength(0)
  })

  it('does not let a regular user change notes', async () => {
    await mockLoginAs(users.user)
    const res = await patch(own._id, [entry('Hacked')])
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('rejects over-long notes', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await patch(own._id, [entry('x'.repeat(2001))], {})
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
