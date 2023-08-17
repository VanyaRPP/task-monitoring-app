import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import handler from './index'
import { expect } from '@jest/globals'
import {
  getPlainJsObjectFromMongoose,
  composeFunctions,
  removeVersion,
  unpopulate,
} from '@utils/helpers'
import { users, realEstates, domains, streets } from '@utils/testData'
import { mockLoginAs } from '@utils/mockLoginAs'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('RealEstate API - GET', () => {
  it('request from the GlobalAdmin - show all companies', async () => {
    await mockLoginAs(users.globalAdmin)

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
    const received = composeFunctions(response.data, [
      getPlainJsObjectFromMongoose,
      unpopulate,
      removeVersion,
    ])

    expect(received).toEqual(realEstates)
  })

  it('request from  User - show User companies', async () => {
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
    const received = composeFunctions(response.data, [
      getPlainJsObjectFromMongoose,
      unpopulate,
      removeVersion,
    ])
    // const domainS = domains.filter((domain)=> domain.adminEmails.includes(users.user.email))
    // const expected = realEstates.filter((company) =>
    //   domains
    //     .find((domain) => domain._id === company.domain)
    //     .adminEmails.includes(users.user.email)
    // )
    const expected = realEstates.filter((company) =>
      company.adminEmails.includes(users.user.email)
    )

    expect(received).toEqual(expected)
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
    const received = composeFunctions(response.data, [
      getPlainJsObjectFromMongoose,
      unpopulate,
      removeVersion,
    ])

    expect(received).toEqual(realEstates.slice(0, limit))
  })

  it('request from the GlobalAdmin by domainId,streetId - show that company', async () => {
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
    const received = composeFunctions(response.data, [
      getPlainJsObjectFromMongoose,
      unpopulate,
      removeVersion,
    ])
    const expected = [realEstates[3]]

    expect(received).toEqual(expected)
  })

  //   it('request from the User by domainId and streetId - restricted access', async () => {
  //     await mockLoginAs(users.user)

  //     const mockReq = {
  //       method: 'GET',
  //       query: {
  //         domainId: domains[0]._id.toString(),
  //         streetId: streets[0]._id.toString(),
  //       },
  //     } as any
  //     const mockRes = {
  //       status: jest.fn(() => mockRes),
  //       json: jest.fn(),
  //     } as any

  //     await handler(mockReq, mockRes)

  //     const response = {
  //       status: mockRes.status,
  //       data: mockRes.json.mock.lastCall[0].data,
  //     }
  //     // console.log(response.data)
  //     expect(response.status).toHaveBeenCalledWith(200)
  //     expect(response.data).toHaveLength(0)
  //   })
  // it('request from DomainAdmin - show DomainAdmin companies', async () => {
  //   await mockLoginAs(users.domainAdmin)//   const mockReq = {
  //     method: 'GET',
  //     query: {},
  //   } as any
  //   const mockRes = {
  //     status: jest.fn(() => mockRes),
  //     json: jest.fn(),
  //   } as any

  //   await handler(mockReq, mockRes)

  //   const response = {
  //     status: mockRes.status,
  //     data: mockRes.json.mock.lastCall[0].data,
  //   }

  //   expect(response.status).toHaveBeenCalledWith(200)

  //   const received = composeFunctions(response.data, [
  //     getPlainJsObjectFromMongoose,
  //     unpopulate,
  //     removeVersion,
  //   ])
  //   const expected = realEstates.filter((company) =>
  //     company.adminEmails.includes(users.domainAdmin.email)
  //   )//   expect(received).toEqual(expected)
  //   console.log(response.data, expected)
  // })
})
