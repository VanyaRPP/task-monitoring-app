import User from '@modules/models/User'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users } from '@utils/testData'
import { getServerSession } from 'next-auth'
import { createMocks } from 'node-mocks-http'
import handler from '../index'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('PATCH /api/user/:id', () => {
  const exec = async (id: string, body: any, sessionUser: any, method: string = 'PATCH') => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: sessionUser })
    const { req, res } = createMocks({
      method: method as any,
      url: `/api/user/${id}`,
      query: { id },
      body,
    })
    await handler(req as any, res as any)
    return res
  }



  it('domain admin can change own name', async () => {
    const user = users.domainAdmin
    const res = await exec(user._id.toString(), { name: 'New Admin' }, user)
    expect(res._getStatusCode()).toBe(200)
    const updated = await User.findById(user._id)
    expect(updated.name).toBe('New Admin')
  })

  it('global admin can change own role', async () => {
    const user = users.globalAdmin
    const res = await exec(user._id.toString(), { roles: ['User'] }, user)
    expect(res._getStatusCode()).toBe(200)
  })
  it('user can change own name', async () => {
    const user = users.user
    const res = await exec(user._id.toString(), { name: 'New Name' }, user)
    expect(res._getStatusCode()).toBe(200)
  })

  it('global admin can update other user name', async () => {
    const res = await exec(users.user._id.toString(), { name: 'G Changed' }, users.globalAdmin)
    expect(res._getStatusCode()).toBe(200)
  })

  it('global admin cannot assign GlobalAdmin role to others', async () => {
    const res = await exec(users.user._id.toString(), { roles: ['GlobalAdmin'] }, users.globalAdmin)
    expect(res._getStatusCode()).toBe(400)
  })

})