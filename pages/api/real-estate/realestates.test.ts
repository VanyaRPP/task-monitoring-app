import { expect } from '@jest/globals'
import RealEstate from '@modules/models/RealEstate'
import { parseReceived } from '@utils/helpers'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, streets, users } from '@utils/testData'
import handler from './index'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('RealEstate API - GET', () => {
  it('request from the GlobalAdmin - show all companies', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = { method: 'GET', query: {} } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)
    const expected = realEstates.filter((estate) => !estate.archived)

    expect(received).toHaveLength(expected.length)
    expect(received).toMatchObject(expected)
  })

  it('request from User - show User companies', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)

    const expected = realEstates.filter(
      (company) =>
        company.adminEmails.includes(users.user.email) && !company.archived
    )

    expect(received).toHaveLength(expected.length)
    expect(received).toMatchObject(expected)
  })

  it('request from the GlobalAdmin with limit - success', async () => {
    const limit = 2

    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { limit },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)

    const expected = realEstates.filter((e) => !e.archived).slice(0, limit)

    expect(received).toHaveLength(expected.length)
    expect(received).toMatchObject(expected)
  })

  // TODO: FIX IT
  it('request from the GlobalAdmin by domainId, streetId - show that company', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[3]._id.toString(),
        streetId: streets[3]._id.toString(),
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)
    const expected = realEstates.filter(
      (company) =>
        company.domain === domains[3]._id.toString() &&
        company.street === streets[3]._id.toString()
    )

    expect(received).toHaveLength(expected.length)
    expect(received).toMatchObject(expected)
  })

  it('request from the User by domainId and streetId', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[0]._id.toString(),
        streetId: streets[0]._id.toString(),
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    const received = parseReceived(response.data)
    const expected = realEstates.filter(
      (company) =>
        company.adminEmails.includes(users.user.email) &&
        company.domain === domains[0]._id.toString() &&
        company.street === streets[0]._id.toString() &&
        !company.archived
    )
    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toHaveLength(expected.length)
    expect(received).toMatchObject(expected)
  })

  it('request from DomainAdmin - show DomainAdmin companies', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)

    const expected = realEstates.filter(
      (r) => r.domain === domains[0]._id && !r.archived
    )

    expect(received).toHaveLength(expected.length)
    expect(received).toMatchObject(expected)
  })

  it('request from DomainAdmin by companyId - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[0]._id.toString() },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)
    const expected: any[] = []

    expect(received).toEqual(expected)
  })

  it('request from User by not his companyId - error ', async () => {
    await mockLoginAs(users.user)
    const mockReq = {
      method: 'GET',
      // not his company. should fail
      query: { companyId: realEstates[2]._id.toString() },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)
    const expected = []

    expect(received).toEqual(expected)
  })
  it('request from DomainAdmin by not his companyId - error ', async () => {
    await mockLoginAs(users.domainAdmin)
    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[1]._id.toString() },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)
    const expected = []

    expect(received).toEqual(expected)
  })
  it('request from DomainAdmin by companyId - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[0]._id.toString() },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const received = parseReceived(response.data)
    const expected: any[] = []

    expect(received).toEqual(expected)
  })

  it('request from the GlobalAdmin by companyId - success', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[3]._id.toString() },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)
    const expected = [realEstates[3]]

    expect(received).toMatchObject(expected)
  })

  it('request from DomainAdmin by domainId & streetId - show suitable companies', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[0]._id.toString(),
        streetId: streets[0]._id.toString(),
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    const received = parseReceived(response.data)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toEqual([])
  })

  it('request from DomainAdmin by domainId & streetId - don`t show not suitable companies', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[1]._id.toString(),
        streetId: streets[1]._id.toString(),
      },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    const received = parseReceived(response.data)
    expect(received).toEqual([])
  })

  it('request from User by domainId & streetId - show suitable companies', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[0]._id.toString(),
        streetId: streets[0]._id.toString(),
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    const received = parseReceived(response.data)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toEqual([])
  })

  it('request from User by domainId & streetId - don`t show not suitable companies', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[2]._id.toString(),
        streetId: streets[2]._id.toString(),
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    const received = parseReceived(response.data)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toEqual([])
  })

  it('test', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        archived: true,
        domainId: domains[2]._id.toString(),
        streetId: streets[2]._id.toString(),
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    const received = parseReceived(response.data)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toEqual([])
  })

  describe('RealEstate API - GET', () => {
    it('User can see archived real estates where he is an admin', async () => {
      await mockLoginAs(users.user)

      const archived = 'true'

      const mockReq = {
        method: 'GET',
        query: {
          archived,
          domainId: domains[1]._id.toString(),
          streetId: streets[1]._id.toString(),
        },
      } as any

      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      const response = {
        status: mockRes.status,
        data: mockRes.json.mock.lastCall[0].data,
      }
      const received = parseReceived(response.data)
      const expected = realEstates.filter(
        (estate) =>
          estate.archived === true &&
          estate.adminEmails.includes(users.user.email) &&
          estate.domain === domains[1]._id.toString() &&
          estate.street === streets[1]._id.toString()
      )

      expect(response.status).toHaveBeenCalledWith(200)
      expect(received).toMatchObject(expected)
    })

    it('DomainAdmin can see all archived companies in his domain', async () => {
      await mockLoginAs(users.domainAdmin)

      const archived = 'true'

      const mockReq = {
        method: 'GET',
        query: {
          archived,
          domainId: domains[0]._id.toString(),
          streetId: streets[0]._id.toString(),
        },
      } as any

      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      const response = {
        status: mockRes.status,
        data: mockRes.json.mock.lastCall[0].data,
      }
      const received = parseReceived(response.data)
      const expected = realEstates.filter(
        (estate) =>
          estate.archived === true &&
          estate.domain === domains[0]._id.toString()
      )

      expect(response.status).toHaveBeenCalledWith(200)
      expect(received).toHaveLength(expected.length)
      expect(received).toMatchObject(expected)
    })
  })
})

describe('RealEstate API - POST (optional description)', () => {
  const baseBody = {
    domain: domains[0]._id,
    street: streets[0]._id,
    companyName: 'ТОВ Без опису',
    adminEmails: ['owner@example.com'],
    currency: 'UAH',
    totalArea: 42,
    pricePerMeter: 10,
    contractNumber: '15',
  }

  const post = async (body: Record<string, unknown>) => {
    const mockReq = { method: 'POST', query: {}, body } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any
    await handler(mockReq, mockRes)
    return mockRes
  }

  it.each([
    ['omitted', {}],
    ['empty string', { description: '' }],
  ])(
    'creates a company when description is %s and stores ""',
    async (_, extra) => {
      await mockLoginAs(users.globalAdmin)

      const res = await post({ ...baseBody, ...extra })

      expect(res.status).toHaveBeenCalledWith(200)
      const created = res.json.mock.lastCall[0].data
      const stored = await RealEstate.findById(created._id).lean()
      expect(stored?.description).toBe('')
    }
  )

  it('keeps the other fields when description is not filled', async () => {
    await mockLoginAs(users.globalAdmin)

    const res = await post(baseBody)

    expect(res.status).toHaveBeenCalledWith(200)
    const stored = await RealEstate.findById(
      res.json.mock.lastCall[0].data._id
    ).lean()
    expect(stored).toMatchObject({
      companyName: 'ТОВ Без опису',
      adminEmails: ['owner@example.com'],
      currency: 'UAH',
      totalArea: 42,
      pricePerMeter: 10,
      contractNumber: '15',
    })
    expect(stored?.domain.toString()).toBe(domains[0]._id.toString())
  })

  it('creates a company with a filled description', async () => {
    await mockLoginAs(users.globalAdmin)

    const res = await post({ ...baseBody, description: 'ЄДРПОУ 12345678' })

    expect(res.status).toHaveBeenCalledWith(200)
    const stored = await RealEstate.findById(
      res.json.mock.lastCall[0].data._id
    ).lean()
    expect(stored?.description).toBe('ЄДРПОУ 12345678')
  })

  it('DomainAdmin creates a company without description in own domain', async () => {
    await mockLoginAs(users.domainAdmin)

    const res = await post(baseBody)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.lastCall[0].data.description).toBe('')
  })

  it('still rejects a company without the required name', async () => {
    await mockLoginAs(users.globalAdmin)

    const { companyName, ...withoutName } = baseBody
    const res = await post(withoutName)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})
