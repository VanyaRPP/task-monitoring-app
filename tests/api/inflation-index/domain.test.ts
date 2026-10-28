/**
 * @jest-environment node
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'

import Domain from '@modules/models/Domain'
import DomainInflationOverride from '@modules/models/DomainInflationOverride'
import DomainInflationOverrideLog from '@modules/models/DomainInflationOverrideLog'
import InflationIndex from '@modules/models/InflationIndex'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import domainHandler from '@pages/api/inflation-index/domain'
import indexHandler from '@pages/api/inflation-index'
import { getCurrentUser } from '@utils/getCurrentUser'

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
  await mongoose.connect(mongo.getUri())
  await DomainInflationOverride.syncIndexes()
}, 120000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

const DOMAIN_A = new Types.ObjectId()
const DOMAIN_B = new Types.ObjectId()
// 1 August 2026, midnight Kyiv (UTC+3).
const AUGUST = new Date('2026-07-31T21:00:00.000Z')

const GLOBAL_ADMIN = {
  isGlobalAdmin: true,
  isDomainAdmin: false,
  isUser: false,
  isAdmin: true,
  user: { _id: new Types.ObjectId(), email: 'global@test.ua' },
}
const ADMIN_A = {
  isGlobalAdmin: false,
  isDomainAdmin: true,
  isUser: false,
  isAdmin: true,
  user: { _id: new Types.ObjectId(), email: 'admin-a@test.ua' },
}
const ADMIN_B = {
  ...ADMIN_A,
  user: { _id: new Types.ObjectId(), email: 'admin-b@test.ua' },
}
const USER_A = {
  isGlobalAdmin: false,
  isDomainAdmin: false,
  isUser: true,
  isAdmin: false,
  user: { _id: new Types.ObjectId(), email: 'owner-a@test.ua' },
}

const as = (access: object) =>
  (getCurrentUser as jest.Mock).mockResolvedValue(access)

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

const call = async (
  handler: typeof domainHandler,
  req: { method: string; query?: object; body?: object }
) => {
  const res = makeRes()
  await handler({ query: {}, ...req } as any, res)
  return {
    status: res.status.mock.calls[0][0],
    body: res.json.mock.calls[0][0],
  }
}

const put = (body: object) => call(domainHandler, { method: 'PUT', body })
const reset = (query: object) =>
  call(domainHandler, { method: 'DELETE', query })

const serviceIndex = async (domain: Types.ObjectId) => {
  const service = await Service.findOne({ domain }).lean()
  return {
    top: service?.inflicionPrice,
    row: service?.customServices?.find(
      (row) => row.fieldName === 'inflicionPrice'
    )?.price,
  }
}

beforeEach(async () => {
  await Promise.all(
    [
      Domain,
      DomainInflationOverride,
      DomainInflationOverrideLog,
      InflationIndex,
      RealEstate,
      Service,
    ].map((model) => (model as mongoose.Model<unknown>).deleteMany({}))
  )
  await Domain.collection.insertMany([
    { _id: DOMAIN_A, name: 'ОСББ А', adminEmails: [ADMIN_A.user.email] },
    { _id: DOMAIN_B, name: 'ОСББ Б', adminEmails: [ADMIN_B.user.email] },
  ])
  await RealEstate.collection.insertOne({
    domain: DOMAIN_A,
    companyName: 'Квартира 1',
    adminEmails: [USER_A.user.email],
  })
  await InflationIndex.create({ year: 2026, month: 8, value: 100.1 })
  for (const domain of [DOMAIN_A, DOMAIN_B]) {
    await Service.collection.insertOne({
      domain,
      date: AUGUST,
      rentPrice: 25,
      inflicionPrice: 100.1,
      customServices: [
        {
          _id: new Types.ObjectId(),
          label: 'Інфляція',
          fieldName: 'inflicionPrice',
          price: 100.1,
        },
      ],
    })
  }
})

const AUGUST_A = { domainId: String(DOMAIN_A), year: 2026, month: 8 }

describe('PUT /api/inflation-index/domain — права', () => {
  it('DomainAdmin змінює індекс свого домену', async () => {
    as(ADMIN_A)

    const { status } = await put({ ...AUGUST_A, value: 101.5 })

    expect(status).toBe(200)
    expect(
      await DomainInflationOverride.findOne({ domain: DOMAIN_A }).lean()
    ).toMatchObject({
      year: 2026,
      month: 8,
      value: 101.5,
      updatedBy: ADMIN_A.user.email,
    })
  })

  it('DomainAdmin чужого домену отримує 403 і нічого не змінює', async () => {
    as(ADMIN_B)

    const { status } = await put({ ...AUGUST_A, value: 101.5 })

    expect(status).toBe(403)
    expect(await DomainInflationOverride.countDocuments()).toBe(0)
    expect(await serviceIndex(DOMAIN_A)).toEqual({ top: 100.1, row: 100.1 })
  })

  it('User отримує 403', async () => {
    as(USER_A)

    expect((await put({ ...AUGUST_A, value: 101.5 })).status).toBe(403)
    expect(await DomainInflationOverride.countDocuments()).toBe(0)
  })

  it('GlobalAdmin змінює будь-який домен', async () => {
    as(GLOBAL_ADMIN)

    const { status } = await put({
      ...AUGUST_A,
      domainId: String(DOMAIN_B),
      value: 99.5,
    })

    expect(status).toBe(200)
    expect(await serviceIndex(DOMAIN_B)).toEqual({ top: 99.5, row: 99.5 })
  })

  it('неіснуючий або кривий домен — 403 навіть для GlobalAdmin', async () => {
    as(GLOBAL_ADMIN)

    expect(
      (
        await put({
          ...AUGUST_A,
          domainId: String(new Types.ObjectId()),
          value: 101,
        })
      ).status
    ).toBe(403)
    expect(
      (await put({ ...AUGUST_A, domainId: 'not-an-id', value: 101 })).status
    ).toBe(403)
  })
})

describe('PUT /api/inflation-index/domain — значення', () => {
  beforeEach(() => as(ADMIN_A))

  it.each([89.9, 120.1, '101', null, Number.NaN])(
    'відкидає %p — індекс має бути числом 90–120',
    async (value) => {
      const { status, body } = await put({ ...AUGUST_A, value })

      expect(status).toBe(400)
      expect(body.message).toBe('Індекс має бути числом від 90 до 120')
      expect(await DomainInflationOverride.countDocuments()).toBe(0)
    }
  )

  it('приймає межі 90 і 120', async () => {
    expect((await put({ ...AUGUST_A, value: 90 })).status).toBe(200)
    expect((await put({ ...AUGUST_A, value: 120 })).status).toBe(200)
  })

  it('відкидає некоректний місяць', async () => {
    expect((await put({ ...AUGUST_A, month: 13, value: 101 })).status).toBe(400)
  })

  it('проставляє значення в послуги свого домену, інший домен без змін', async () => {
    await put({ ...AUGUST_A, value: 101.5 })

    expect(await serviceIndex(DOMAIN_A)).toEqual({ top: 101.5, row: 101.5 })
    expect(await serviceIndex(DOMAIN_B)).toEqual({ top: 100.1, row: 100.1 })
  })

  it('логує, хто і коли змінив, з попереднім значенням', async () => {
    await put({ ...AUGUST_A, value: 101.5 })
    await put({ ...AUGUST_A, value: 102 })

    const log = await DomainInflationOverrideLog.find({ domain: DOMAIN_A })
      .sort({ date: 1 })
      .lean()

    expect(log).toEqual([
      expect.objectContaining({
        action: 'set',
        before: null,
        after: 101.5,
        actorEmail: ADMIN_A.user.email,
        date: expect.any(Date),
      }),
      expect.objectContaining({ action: 'set', before: 101.5, after: 102 }),
    ])
  })
})

describe('DELETE /api/inflation-index/domain — скинути до довідника', () => {
  beforeEach(async () => {
    as(ADMIN_A)
    await put({ ...AUGUST_A, value: 101.5 })
  })

  it('прибирає перевизначення і повертає послугам значення довідника', async () => {
    const { status } = await reset(AUGUST_A)

    expect(status).toBe(200)
    expect(await DomainInflationOverride.countDocuments()).toBe(0)
    expect(await serviceIndex(DOMAIN_A)).toEqual({ top: 100.1, row: 100.1 })
    expect(
      await DomainInflationOverrideLog.findOne({ action: 'reset' }).lean()
    ).toMatchObject({
      before: 101.5,
      after: null,
      actorEmail: ADMIN_A.user.email,
    })
  })

  it('місяць без значення довідника лишається порожнім', async () => {
    await InflationIndex.deleteMany({})

    await reset(AUGUST_A)

    expect(await serviceIndex(DOMAIN_A)).toEqual({ top: 0, row: 0 })
  })

  it('нічого скидати — 404', async () => {
    await reset(AUGUST_A)

    expect((await reset(AUGUST_A)).status).toBe(404)
  })

  it('DomainAdmin чужого домену і User отримують 403', async () => {
    as(ADMIN_B)
    expect((await reset(AUGUST_A)).status).toBe(403)

    as(USER_A)
    expect((await reset(AUGUST_A)).status).toBe(403)

    expect(await DomainInflationOverride.countDocuments()).toBe(1)
  })
})

describe('GET /api/inflation-index/domain', () => {
  const get = (domain: Types.ObjectId) =>
    call(domainHandler, {
      method: 'GET',
      query: { domainId: String(domain), from: '2026-07', to: '2026-09' },
    })

  it('показує довідник, значення домену і дозвіл на редагування', async () => {
    as(ADMIN_A)
    await put({ ...AUGUST_A, value: 101.5 })

    const { status, body } = await get(DOMAIN_A)

    expect(status).toBe(200)
    expect(body.data.canEdit).toBe(true)
    expect(body.data.months).toEqual([
      { year: 2026, month: 7, reference: null, override: null, value: null },
      {
        year: 2026,
        month: 8,
        reference: 100.1,
        override: {
          value: 101.5,
          updatedBy: ADMIN_A.user.email,
          updatedAt: expect.any(String),
        },
        value: 101.5,
      },
      { year: 2026, month: 9, reference: null, override: null, value: null },
    ])
  })

  it('User свого домену бачить, але без права редагувати', async () => {
    as(USER_A)

    const { status, body } = await get(DOMAIN_A)

    expect(status).toBe(200)
    expect(body.data.canEdit).toBe(false)
  })

  it('чужий домен — 403', async () => {
    as(USER_A)
    expect((await get(DOMAIN_B)).status).toBe(403)

    as(ADMIN_B)
    expect((await get(DOMAIN_A)).status).toBe(403)
  })
})

describe('GET /api/inflation-index — пріоритет домену над довідником', () => {
  const indexes = (query: object) =>
    call(indexHandler, {
      method: 'GET',
      query: { from: '2026-08', to: '2026-08', ...query },
    })

  beforeEach(async () => {
    as(ADMIN_A)
    await put({ ...AUGUST_A, value: 101.5 })
  })

  it('для свого домену — значення домену', async () => {
    const { body } = await indexes({ domainId: String(DOMAIN_A) })

    expect(body.data).toEqual([
      expect.objectContaining({
        year: 2026,
        month: 8,
        value: 101.5,
        domainOverride: true,
      }),
    ])
  })

  it('для іншого домену і без домену — довідник', async () => {
    as(GLOBAL_ADMIN)

    expect((await indexes({ domainId: String(DOMAIN_B) })).body.data).toEqual([
      expect.objectContaining({ value: 100.1 }),
    ])
    expect((await indexes({})).body.data).toEqual([
      expect.objectContaining({ value: 100.1 }),
    ])
  })

  it('з чужим доменом — 403', async () => {
    as(ADMIN_B)

    expect((await indexes({ domainId: String(DOMAIN_A) })).status).toBe(403)
  })
})
