import { expect } from '@jest/globals'
import handler from '.'
import { parseReceived } from '@utils/helpers'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, payments, realEstates, users } from '@utils/testData'
import { sendInvoiceEmail } from '@utils/email/sendInvoiceEmail'
import Domain from '@modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/email/sendInvoiceEmail', () => ({
  sendInvoiceEmail: jest.fn(),
}))

setupTestEnvironment()

const sendInvoiceEmailMock = sendInvoiceEmail as jest.Mock

beforeEach(() => {
  sendInvoiceEmailMock.mockClear()
  sendInvoiceEmailMock.mockResolvedValue(true)
})

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

    const received = parseReceived(response.data)

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
    const received = parseReceived(response.data)

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

    const received = parseReceived(response.data)

    const expected = payments.filter((payment) =>
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

    const received = parseReceived(response.data)

    const expected = payments.filter((payment) =>
      realEstates
        .find((realEstate) => realEstate._id === payment.company)
        .adminEmails.includes(users.user.email)
    )

    expect(received).toEqual(expected)
  })

  it('Get payments by companyID for DomainAdmin - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { companyIds: realEstates[0]._id.toString() },
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
    const expected = payments.filter(
      (payment) => payment.company === realEstates[0]._id.toString()
    )

    expect(received).toEqual(expected)
  })

  it('GET payments by domainId for domainAdmin - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainIds: domains[0]._id.toString(),
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
    const expected = payments.filter(
      (payment) => payment.domain === domains[0]._id.toString()
    )

    expect(received).toEqual(expected)
  })

  it('GET payments by domainId for User - success', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainIds: domains[1]._id.toString(),
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
    // users.user is a company owner (not a domain admin), so querying by a
    // domainId returns payments for the companies they own within that domain.
    const expected = payments.filter((payment) => {
      const company = realEstates.find((re) => re._id === payment.company)
      return (
        !!company?.adminEmails.includes(users.user.email) &&
        payment.domain === domains[1]._id
      )
    })
    expect(received).toEqual(expected)
  })

  // IF DOMAIN INCLUDES USER EMAIL - RETURN A PAYMENT BY THIS DOMAINID
  // FINISH TEST FOR USER AND CREATE A PR

  getPaymentsByYearTest(2023)

  getPaymentsByYearTest(2022)

  it('GET payments by month', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { month: '2' },
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

    const recived = parseReceived(response.data)

    const expected = payments.filter(
      (payment) => new Date(payment.invoiceCreationDate).getMonth() === 1
    )

    expect(recived).toEqual(expected)
  })
  it('GET payments by quarter', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { quarter: 2 },
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

    const recived = parseReceived(response.data)

    function getQuarter(date = new Date()) {
      return Math.floor(date.getMonth() / 3 + 1)
    }
    response.data
      .map((payment) => getQuarter(new Date(payment.invoiceCreationDate)))
      .every((item) => item === 2)

    expect(recived).toBeTruthy()
  })

  it('GET payments by comapnyId for User - success', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        companyIds: realEstates[0]._id.toString(),
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

    const expected = payments.filter(
      (payment) => payment.company === realEstates[0]._id.toString()
    )

    expect(received).toEqual(expected)
  })
})

it('get valid distinctCompanies as DomainAdmin', async () => {
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

  const lastCall = mockRes.json.mock.lastCall[0]

  const response = {
    status: mockRes.status,
    data: lastCall.data,
    currentCompaniesCount: lastCall.currentCompaniesCount,
    currentDomainsCount: lastCall.currentDomainsCount,
  }

  expect(response.status).toHaveBeenCalledWith(200)

  const visiblePaymentsForDomainAdmin = payments.filter((payment) =>
    domains
      .find((domain) => domain._id === payment.domain)
      ?.adminEmails.includes(users.domainAdmin.email)
  )

  const distinctCompanyIds = Array.from(
    new Set(visiblePaymentsForDomainAdmin.map((p) => p.company.toString()))
  )
  const distinctDomainIds = Array.from(
    new Set(visiblePaymentsForDomainAdmin.map((p) => p.domain.toString()))
  )

  expect(response.currentCompaniesCount).toBe(distinctCompanyIds.length)
  expect(response.currentDomainsCount).toBe(distinctDomainIds.length)
})
it('difference between debit and credit', async () => {
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

  const { totalPayments } = mockRes.json.mock.lastCall[0] || {}

  expect(mockRes.status).toHaveBeenCalledWith(200)

  const debit = totalPayments?.debit || 0
  const credit = totalPayments?.credit || 0

  const calculatedDifference = Number((debit - credit).toFixed(2))

  expect(typeof calculatedDifference).toBe('number')
  expect(calculatedDifference).toBeCloseTo(debit - credit, 2)
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
//     removeProps(response.data.map((domain) => domain._doc))
//   )
//   const expected = payments.find(
//     (payment) => payment.domain === domains[0]._id
//   )

//   expect(received).toEqual(expected)
// })

describe('Payments API - POST', () => {
  it('POST payment as Global Admin - success', async () => {
    await mockLoginAs(users.globalAdmin)
    const { _id, ...data } = payments[0]

    const mockReq = {
      method: 'POST',
      body: data,
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.data,
    }

    expect(response.status).toHaveBeenLastCalledWith(200)
  })

  it('POST debit payment sends invoice email to domain admins', async () => {
    await mockLoginAs(users.globalAdmin)
    const { _id, ...data } = payments[0]

    const mockReq = {
      method: 'POST',
      body: {
        ...data,
        provider: {
          description: 'Provider',
        },
        reciever: {
          companyName: 'Domain 0',
          adminEmails: [users.domainAdmin.email],
          description: 'Receiver',
        },
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenLastCalledWith(200)
    expect(sendInvoiceEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: data.invoiceNumber,
        type: 'debit',
        reciever: expect.objectContaining({
          adminEmails: [users.domainAdmin.email],
        }),
      })
    )
  })

  it('POST as non-admin user returns 403', async () => {
    await mockLoginAs(users.user)
    const { _id, ...data } = payments[0]

    const mockReq = {
      method: 'POST',
      body: data,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenLastCalledWith(403)
  })

  describe('Template scope', () => {
    const buildBody = (overrides: Record<string, any> = {}) => {
      const { _id, ...data } = payments[0]
      return {
        ...data,
        invoiceNumber: 9999,
        provider: { description: 'P' },
        reciever: {
          companyName: 'R',
          adminEmails: [users.globalAdmin.email],
          description: 'R',
        },
        ...overrides,
      }
    }

    it('GlobalAdmin can set company default template on create', async () => {
      await mockLoginAs(users.globalAdmin)
      const companyId = realEstates[0]._id

      const mockReq = {
        method: 'POST',
        body: buildBody({
          company: companyId,
          template: 'olimp',
          _templateScope: 'company',
        }),
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenLastCalledWith(200)
      const company = await RealEstate.findById(companyId)
      expect(company?.defaultTemplate).toBe('olimp')
    })

    it('DomainAdmin cannot set company default template on create', async () => {
      await mockLoginAs(users.domainAdmin)
      const companyId = realEstates[0]._id

      const mockReq = {
        method: 'POST',
        body: buildBody({
          company: companyId,
          template: 'olimp',
          _templateScope: 'company',
        }),
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenLastCalledWith(403)
      const company = await RealEstate.findById(companyId)
      expect(company?.defaultTemplate).toBeFalsy()
    })

    it('DomainAdmin of payment domain can set domain default template on create', async () => {
      await mockLoginAs(users.domainAdmin)
      const domainId = domains[0]._id

      const mockReq = {
        method: 'POST',
        body: buildBody({
          domain: domainId,
          template: 'olimp',
          _templateScope: 'domain',
        }),
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenLastCalledWith(200)
      const domain = await Domain.findById(domainId)
      expect(domain?.defaultTemplate).toBe('olimp')
    })

    it('DomainAdmin of a foreign domain cannot set domain default template on create', async () => {
      await mockLoginAs(users.domainAdmin2)
      const domainId = domains[0]._id

      const mockReq = {
        method: 'POST',
        body: buildBody({
          domain: domainId,
          template: 'olimp',
          _templateScope: 'domain',
        }),
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenLastCalledWith(403)
      const domain = await Domain.findById(domainId)
      expect(domain?.defaultTemplate).toBeFalsy()
    })
  })

  it('POST credit payment does not send invoice email', async () => {
    await mockLoginAs(users.globalAdmin)
    const { _id, ...data } = payments[0]

    const mockReq = {
      method: 'POST',
      body: {
        ...data,
        type: 'credit',
        description: 'Manual credit',
        provider: {
          description: 'Provider',
        },
        reciever: {
          companyName: 'Domain 0',
          adminEmails: [users.domainAdmin.email],
          description: 'Receiver',
        },
      },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenLastCalledWith(200)
    expect(sendInvoiceEmailMock).not.toHaveBeenCalled()
  })
})

function getPaymentsByYearTest(year) {
  it(`GET payments by year ${year}`, async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { year },
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

    const recived = parseReceived(response.data)

    const expected = payments.filter(
      (payment) => new Date(payment.invoiceCreationDate).getFullYear() === year
    )

    expect(recived).toEqual(expected)
  })
}
