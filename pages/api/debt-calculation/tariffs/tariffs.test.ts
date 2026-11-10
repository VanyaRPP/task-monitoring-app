import { expect } from '@jest/globals'
import Domain from '@modules/models/Domain'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, streets, users } from '@utils/testData'
import handler from './index'
import readHandler from './read'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
// The PDF's text, as `unpdf` would give it: the file itself is not the point.
jest.mock('@common/services/aiAssistant/documents/pdf', () => ({
  ...jest.requireActual('@common/services/aiAssistant/documents/pdf'),
  readPdfText: jest.fn(async () => [
    [
      {
        str: 'адресою street_0 за період з 01.08.2018',
        x: 85,
        y: 756,
        width: 300,
      },
      { str: 'Період дії тарифів', x: 113, y: 712, width: 99 },
      { str: 'Номери квартир', x: 279, y: 712, width: 91 },
      { str: 'Тарифи на', x: 416, y: 712, width: 62 },
      { str: 'З 01.01. 2024 по даний час', x: 113, y: 642, width: 142 },
      { str: 'Усі квартири', x: 113, y: 628, width: 60 },
      { str: '9,91', x: 416, y: 628, width: 21 },
    ],
  ]),
}))

setupTestEnvironment()

const OWN = domains[0]._id
const FOREIGN = domains[1]._id
const PDF = `data:application/pdf;base64,${Buffer.from('%PDF-1.4').toString('base64')}`

const TARIFFS = {
  street: streets[0]._id,
  groups: [
    { label: 'І поверх', apartments: '1-4' },
    { label: 'вище', apartments: '' },
  ],
  periods: [
    { from: '2019-06-11', tariffs: [4.1, 6] },
    { from: '2024-01-01', tariffs: [7, 9] },
  ],
}

function createMockRes() {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  return res
}

const call = async (
  method: string,
  { query = {}, body = {} }: { query?: object; body?: object } = {}
) => {
  const res = createMockRes()
  await handler({ method, query, body } as any, res)
  return {
    status: res.status.mock.calls[0]?.[0],
    body: res.json.mock.calls[0]?.[0],
  }
}

describe('/api/debt-calculation/tariffs', () => {
  it('turns away a request without a session', async () => {
    const { status } = await call('GET', { query: { domainId: OWN } })
    expect(status).toBe(401)
  })

  it('turns away an admin of another domain, for reading and writing', async () => {
    await mockLoginAs(users.domainAdmin2)
    expect((await call('GET', { query: { domainId: OWN } })).status).toBe(403)

    await mockLoginAs(users.domainAdmin2)
    const put = await call('PUT', { body: { domainId: OWN, tariffs: TARIFFS } })
    expect(put.status).toBe(403)
    const stored = await Domain.findById(OWN).select('+debtTariffs').lean()
    expect(stored.debtTariffs ?? []).toEqual([])
  })

  it('saves a building’s tariffs for the domain admin and reads them back', async () => {
    await mockLoginAs(users.domainAdmin)
    const put = await call('PUT', { body: { domainId: OWN, tariffs: TARIFFS } })
    expect(put.status).toBe(200)

    await mockLoginAs(users.domainAdmin)
    const { status, body } = await call('GET', { query: { domainId: OWN } })
    expect(status).toBe(200)
    expect(body.data).toEqual([{ ...TARIFFS, updatedAt: expect.any(String) }])
  })

  it('keeps the tariffs out of every other domain query', async () => {
    await mockLoginAs(users.domainAdmin)
    await call('PUT', { body: { domainId: OWN, tariffs: TARIFFS } })

    const plain = await Domain.findById(OWN).lean()
    expect(plain).not.toHaveProperty('debtTariffs')
  })

  it('refuses an address of another domain', async () => {
    await mockLoginAs(users.domainAdmin)
    const { status } = await call('PUT', {
      body: { domainId: OWN, tariffs: { ...TARIFFS, street: streets[1]._id } },
    })
    expect(status).toBe(400)
  })

  it('removes a building’s tariffs saved with no periods', async () => {
    await mockLoginAs(users.domainAdmin)
    await call('PUT', { body: { domainId: OWN, tariffs: TARIFFS } })
    await mockLoginAs(users.domainAdmin)
    await call('PUT', {
      body: { domainId: OWN, tariffs: { ...TARIFFS, periods: [] } },
    })

    await mockLoginAs(users.domainAdmin)
    const { body } = await call('GET', { query: { domainId: OWN } })
    expect(body.data).toEqual([])
  })
})

describe('/api/debt-calculation/tariffs/read', () => {
  const read = async (body: object) => {
    const res = createMockRes()
    await readHandler({ method: 'POST', query: {}, body } as any, res)
    return {
      status: res.status.mock.calls[0]?.[0],
      body: res.json.mock.calls[0]?.[0],
    }
  }

  it('reads the table and finds the domain’s address it names', async () => {
    await mockLoginAs(users.domainAdmin)
    const { status, body } = await read({ domainId: OWN, file: PDF })

    expect(status).toBe(200)
    expect(body.data.street).toBe(streets[0]._id)
    expect(body.data.tariffs.periods).toEqual([
      { from: '2024-01-01', tariffs: [9.91] },
    ])
  })

  it('turns away an admin of another domain', async () => {
    await mockLoginAs(users.domainAdmin)
    expect((await read({ domainId: FOREIGN, file: PDF })).status).toBe(403)
  })

  it('wants a PDF', async () => {
    await mockLoginAs(users.domainAdmin)
    const { status } = await read({
      domainId: OWN,
      file: 'data:image/png;base64,AAAA',
    })
    expect(status).toBe(400)
  })
})
