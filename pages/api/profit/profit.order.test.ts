/**
 * @jest-environment node
 */

/**
 * Month order of the legacy GET /api/profit list. The route builds its rows in
 * the order the payments come back and the table on /payment/profit renders
 * them as they are. Until Payment got its domain index that order was a
 * collection scan - creation order. These run the real handler against
 * in-memory Mongo with the schema indexes built, so a plan change shows up as
 * a reordered list.
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'
import dayjs from 'dayjs'
import type { NextApiRequest, NextApiResponse } from 'next'

import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import { getCurrentUser } from '@utils/getCurrentUser'
import { testConnectOptions } from '@utils/setupTestEnvironment'
import handler from './index'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

jest.setTimeout(120000)

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } })
  await mongoose.connect(mongo.getUri(), testConnectOptions)
  // The point of these tests: the query has the domain index to take.
  await Payment.createIndexes()
}, 120000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

afterEach(async () => {
  await Payment.deleteMany({})
  await Domain.deleteMany({})
})

const ADMIN_EMAIL = 'admin-a@test.ua'
const domain = new Types.ObjectId()
const otherDomain = new Types.ObjectId()

const seedDomains = () =>
  Domain.collection.insertMany([
    {
      _id: domain,
      name: 'Domain A',
      adminEmails: [ADMIN_EMAIL],
      streets: [],
      description: '',
    },
    {
      _id: otherDomain,
      name: 'Domain B',
      adminEmails: ['someone-else@test.ua'],
      streets: [],
      description: '',
    },
  ])

/** The 10th of the month `monthsAgo` months back - inside the 12-month window. */
const dayIn = (monthsAgo: number) =>
  dayjs().subtract(monthsAgo, 'month').startOf('month').add(9, 'day').toDate()

const monthKey = (date: Date) => dayjs(date).format('YYYY-MM')

/** Inserted one by one, so creation order is exactly the call order. */
const insertCredits = async (monthsAgo: number[], inDomain = domain) => {
  for (const ago of monthsAgo) {
    await Payment.collection.insertOne({
      type: 'credit',
      domain: inDomain,
      company: new Types.ObjectId(),
      generalSum: 100,
      invoiceCreationDate: dayIn(ago),
    })
  }
}

const getMonthsAsDomainAdmin = async (): Promise<string[]> => {
  ;(getCurrentUser as jest.Mock).mockResolvedValue({
    isDomainAdmin: true,
    isGlobalAdmin: false,
    isAdmin: true,
    user: { email: ADMIN_EMAIL },
  })
  const req = { method: 'GET', query: {} } as NextApiRequest
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as NextApiResponse

  await handler(req, res)

  expect(res.status).toHaveBeenCalledWith(200)
  const body = (res.json as jest.Mock).mock.calls[0][0]
  return body.data.map(({ month }: { month: string }) => month)
}

describe('legacy GET /api/profit - month order for a DomainAdmin', () => {
  it('runs with the domain index in place', async () => {
    const names = (await Payment.collection.indexes()).map(({ name }) => name)
    expect(names).toContain('domain_1_invoiceCreationDate_-1')
  })

  it('lists months in the order their payments were created', async () => {
    await seedDomains()
    await insertCredits([3, 2, 1])

    expect(await getMonthsAsDomainAdmin()).toEqual(
      [3, 2, 1].map((ago) => monthKey(dayIn(ago)))
    )
  })

  it('keeps creation order, not calendar order - as the collection scan did', async () => {
    await seedDomains()
    // An older month paid late, after a newer one.
    await insertCredits([1, 3, 2])
    await insertCredits([4], otherDomain)

    const expected = [1, 3, 2].map((ago) => monthKey(dayIn(ago)))
    const naturalOrder = (
      await Payment.find({ domain }).sort({ $natural: 1 }).lean()
    ).map(({ invoiceCreationDate }) => monthKey(invoiceCreationDate))

    expect(naturalOrder).toEqual(expected)
    expect(await getMonthsAsDomainAdmin()).toEqual(expected)
  })
})
