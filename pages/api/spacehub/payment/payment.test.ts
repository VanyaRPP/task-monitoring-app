import { expect } from '@jest/globals'
import handler from '.'

import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { mockLoginAs } from '@utils/mockLoginAs'
import { domains, payments, realEstates, users } from '@utils/testData'
import {
  getPlainJsObjectFromMongoose,
  composeFunctions,
  removeVersion,
  unpopulate,
} from '@utils/helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Payments API - GET', () => {
  it('load payments as GlobalAdmin - success', async () => {
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

    expect(received).toEqual(payments)
  })

  it('load payments as GlobalAdmin with limit - success', async () => {
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

    expect(received).toEqual(payments.slice(0, limit))
  })

  it('load payments as DomainAdmin - success', async () => {
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

    const received = composeFunctions(response.data, [
      getPlainJsObjectFromMongoose,
      unpopulate,
      removeVersion,
    ])

    const expected = payments
      .filter((payment) =>
        domains
          .find((domain) => domain._id === payment.domain)
          .adminEmails.includes(users.domainAdmin.email)
      )

    expect(received).toEqual(expected)
  })

  it('load payments as User - success', async () => {
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

    const expected = payments
      .filter((payment) =>
        realEstates
          .find((realEstate) => realEstate._id === payment.company)
          .adminEmails.includes(users.user.email)
      )

    expect(received).toEqual(expected)
  })

  // it('load payments as GlobalAdmin by domainId - success', async () => {
  //   await mockLoginAs(users.globalAdmin)

  //   const mockReq = {
  //     method: 'GET',
  //     query: { domainIds: domains[0]._id },
  //   } as any
  //   const mockRes = {
  //     status: jest.fn(() => mockRes),
  //     json: jest.fn(),
  //   } as any

  //   // ??? BUG: TypeError: (filterIds || "").split is not a function at filterOptions
  //   await handler(mockReq, mockRes)

  //   const response = {
  //     status: mockRes.status,
  //     data: mockRes.json.mock.lastCall[0].data,
  //   }

  //   expect(response.status).toHaveBeenCalledWith(200)

  //   const received = unpopulate(
  //     removeVersion(response.data.map((domain) => domain._doc))
  //   )
  //   const expected = payments.find(
  //     (payment) => payment.domain === domains[0]._id
  //   )

  //   expect(received).toEqual(expected)
  // })
})

describe('Payments API - POST', () => {
  // TODO: POST tests
})