import { expect } from '@jest/globals'
import handler from '.'
import Domain from '@modules/models/Domain'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { realEstates, users, domains } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('RealEstate API - PATCH', () => {
  it('should update realEstates as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = { ...realEstates[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
      body: updatedData,
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
    expect(response.data.description).toBe(updatedData.description)
  })

  it('should update valid realEstates as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...realEstates[0],
      description: 'updated',
      domain: domains[0],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
      body: updatedData,
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
    expect(response.data.description).toBe(updatedData.description)
  })

  it('should not update not valid realEstates as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...realEstates[1],
      description: 'updated',
      domain: domains[1],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[1]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
    }

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should not update valid realEstates with not valid domain as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...realEstates[0],
      description: 'updated',
      domain: domains[1],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
    }

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should not update realEstates as User', async () => {
    await mockLoginAs(users.user)

    const updatedData = { ...realEstates[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
    }

    expect(response.status).toHaveBeenCalledWith(400)
  })

  describe('change domain (Relocate Company)', () => {
    it('GlobalAdmin moves a company to another domain (domain passed as object)', async () => {
      await mockLoginAs(users.globalAdmin)

      const updatedData = {
        ...realEstates[0],
        domain: domains[3],
      }
      const mockReq = {
        method: 'PATCH',
        query: { id: realEstates[0]._id },
        body: updatedData,
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      const data = mockRes.json.mock.lastCall[0].data
      expect(data.domain.toString()).toBe(domains[3]._id)
    })

    it('GlobalAdmin moves a company to another domain (domain passed as string)', async () => {
      await mockLoginAs(users.globalAdmin)

      const updatedData = {
        ...realEstates[0],
        domain: domains[3]._id,
      }
      const mockReq = {
        method: 'PATCH',
        query: { id: realEstates[0]._id },
        body: updatedData,
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      const data = mockRes.json.mock.lastCall[0].data
      expect(data.domain.toString()).toBe(domains[3]._id)
    })

    it('DomainAdmin moves a company between two of their own domains', async () => {
      // Make domainAdmin admin of a second domain (domains[3]).
      await Domain.updateOne(
        { _id: domains[3]._id },
        { $set: { adminEmails: [users.domainAdmin.email] } }
      )
      await mockLoginAs(users.domainAdmin)

      const updatedData = {
        ...realEstates[0],
        domain: domains[3]._id, // string, as the frontend now sends
      }
      const mockReq = {
        method: 'PATCH',
        query: { id: realEstates[0]._id },
        body: updatedData,
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      const data = mockRes.json.mock.lastCall[0].data
      expect(data.domain.toString()).toBe(domains[3]._id)
    })

    it('DomainAdmin cannot move a company to a foreign domain (string body)', async () => {
      await mockLoginAs(users.domainAdmin)

      const updatedData = {
        ...realEstates[0],
        domain: domains[1]._id, // foreign domain, string
      }
      const mockReq = {
        method: 'PATCH',
        query: { id: realEstates[0]._id },
        body: updatedData,
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('DomainAdmin cannot edit a company that is not in any of their domains', async () => {
      await mockLoginAs(users.domainAdmin)

      // realEstates[1] lives in domains[1] — not domainAdmin's.
      // Even if they try to "claim" it by sending body.domain = own domain,
      // the current-domain ownership check must reject.
      const updatedData = {
        ...realEstates[1],
        description: 'hostile takeover attempt',
        domain: domains[0]._id,
      }
      const mockReq = {
        method: 'PATCH',
        query: { id: realEstates[1]._id },
        body: updatedData,
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('returns 404 when realEstate does not exist (DomainAdmin path)', async () => {
      await mockLoginAs(users.domainAdmin)

      const mockReq = {
        method: 'PATCH',
        query: { id: '64d68421d9ba2fc8fea79dff' },
        body: { description: 'x', domain: domains[0]._id },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  it('should not update realEstates with not valid fields as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = {
      ...realEstates[0],
      description: 'updated',
      notValidField: 'notValidField',
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
      body: updatedData,
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
    expect(response.data.notValidField).toBe(undefined)
  })
})

describe('RealEstate API - DELETE', () => {
  it('should be able to successfully remove the company as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'DELETE',
      query: { id: realEstates[0]._id },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    )
  })

  it('should be able to successfully remove his company from his domain as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'DELETE',
      query: { id: realEstates[0]._id },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    )
  })

  it('should prevent a company from deleting another domain as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'DELETE',
      query: { id: realEstates[1]._id },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(403)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('not allowed'),
      })
    )
  })

  it('should return a 404 error when attempting to delete a nonexistent company (DomainAdmin)', async () => {
    await mockLoginAs(users.domainAdmin)

    const fakeId = '64d68421d9ba2fc8fea79dff'
    const mockReq = {
      method: 'DELETE',
      query: { id: fakeId },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'realestate not found',
      })
    )
  })

  it('should prevent ordinary users from deleting the company (User)', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'DELETE',
      query: { id: realEstates[0]._id },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(403)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('not allowed'),
      })
    )
  })
})
