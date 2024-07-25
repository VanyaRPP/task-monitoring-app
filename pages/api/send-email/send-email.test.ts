import { expect } from '@jest/globals'
import handler from '.'

import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import { Roles } from '@utils/constants'
import { mockLoginAs } from '@utils/mockLoginAs'
// TODO: separated test of pdf creation
// import { generateHtmlFromThemplate } from '@utils/pdf/pdfThemplate'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, payments, realEstates, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('SendMail API - GET', () => {
  it('should get empty response', async () => {
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

    const received = response.data
    const expected = ''

    expect(received).toEqual(expected)
  })
})

describe('SendMail API - POST', () => {
  it('should send email as DomainAdmin', async () => {
    const payment = payments.find(
      ({ _id }) => _id === '64d68421d9ba2fc8fea79d63'
    )
    const domain = domains.find(({ _id }) => _id === payment.domain)
    const company = realEstates.find(({ _id }) => _id === payment.company)
    const defaultDateFormat = dateToDefaultFormat(
      payment.invoiceCreationDate.toString()
    )

    await mockLoginAs({
      email: domain.adminEmails?.[0],
      roles: [Roles.DOMAIN_ADMIN],
    })

    const mockReq = {
      method: 'POST',
      body: {
        domainId: domain?._id,
        companyId: company?._id,
        to: ['ligos36529@cmheia.com'],
        subject: `Оплата від ${defaultDateFormat}`,
        text: `Ви отримали новий рахунок від "${payment.domain}" за ${defaultDateFormat}`,
        // html: await generateHtmlFromThemplate(payment),
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

    expect(response.status).toHaveBeenCalledWith(201)
  })

  it('should send email as GlobalAdmin', async () => {
    const payment = payments.find(
      ({ _id }) => _id === '64d68421d9ba2fc8fea79d63'
    )
    const domain = domains.find(({ _id }) => _id === payment.domain)
    const company = realEstates.find(({ _id }) => _id === payment.company)
    const defaultDateFormat = dateToDefaultFormat(
      payment.invoiceCreationDate.toString()
    )

    await mockLoginAs({
      email: domain.adminEmails?.[0],
      roles: [Roles.GLOBAL_ADMIN],
    })

    const mockReq = {
      method: 'POST',
      body: {
        domainId: domain?._id,
        companyId: company?._id,
        to: ['ligos36529@cmheia.com'],
        subject: `Оплата від ${defaultDateFormat}`,
        text: `Ви отримали новий рахунок від "${payment.domain}" за ${defaultDateFormat}`,
        // html: await generateHtmlFromThemplate(payment),
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

    expect(response.status).toHaveBeenCalledWith(201)
  })

  it('should send email as GlobalAdmin of another domain', async () => {
    const payment = payments.find(
      ({ _id }) => _id === '64d68421d9ba2fc8fea79d63'
    )
    const domain = domains.find(({ _id }) => _id === payment.domain)
    const company = realEstates.find(({ _id }) => _id === payment.company)
    const defaultDateFormat = dateToDefaultFormat(
      payment.invoiceCreationDate.toString()
    )

    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'POST',
      body: {
        domainId: domain?._id,
        companyId: company?._id,
        to: ['ligos36529@cmheia.com'],
        subject: `Оплата від ${defaultDateFormat}`,
        text: `Ви отримали новий рахунок від "${payment.domain}" за ${defaultDateFormat}`,
        // html: await generateHtmlFromThemplate(payment),
      },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    Roles.ADMIN

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(201)
  })

  it('should NOT send email as User - restricted access', async () => {
    const payment = payments.find(
      ({ _id }) => _id === '64d68421d9ba2fc8fea79d63'
    )
    const domain = domains.find(({ _id }) => _id === payment.domain)
    const company = realEstates.find(({ _id }) => _id === payment.company)
    const defaultDateFormat = dateToDefaultFormat(
      payment.invoiceCreationDate.toString()
    )

    await mockLoginAs(users.user)

    const mockReq = {
      method: 'POST',
      body: {
        domainId: domain?._id,
        companyId: company?._id,
        to: ['ligos36529@cmheia.com'],
        subject: `Оплата від ${defaultDateFormat}`,
        text: `Ви отримали новий рахунок від "${payment.domain}" за ${defaultDateFormat}`,
        // html: await generateHtmlFromThemplate(payment),
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

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should NOT send email without Role - restricted access', async () => {
    const payment = payments.find(
      ({ _id }) => _id === '64d68421d9ba2fc8fea79d63'
    )
    const domain = domains.find(({ _id }) => _id === payment.domain)
    const company = realEstates.find(({ _id }) => _id === payment.company)
    const defaultDateFormat = dateToDefaultFormat(
      payment.invoiceCreationDate.toString()
    )

    await mockLoginAs(users.noRoleUser)

    const mockReq = {
      method: 'POST',
      body: {
        domainId: domain?._id,
        companyId: company?._id,
        to: ['ligos36529@cmheia.com'],
        subject: `Оплата від ${defaultDateFormat}`,
        text: `Ви отримали новий рахунок від "${payment.domain}" за ${defaultDateFormat}`,
        // html: await generateHtmlFromThemplate(payment),
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

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should NOT send email as DomainAdmin of another domain - restricted access', async () => {
    const payment = payments.find(
      ({ _id }) => _id === '64d68421d9ba2fc8fea79d63'
    )
    const domain = domains.find(({ _id }) => _id === payment.domain)
    const company = realEstates.find(({ _id }) => _id === payment.company)
    const defaultDateFormat = dateToDefaultFormat(
      payment.invoiceCreationDate.toString()
    )

    await mockLoginAs({
      email: 'random.domain.admin.email@gmail.com',
      roles: [Roles.DOMAIN_ADMIN],
    })

    const mockReq = {
      method: 'POST',
      body: {
        domainId: domain?._id,
        companyId: company?._id,
        to: ['ligos36529@cmheia.com'],
        subject: `Оплата від ${defaultDateFormat}`,
        text: `Ви отримали новий рахунок від "${payment.domain}" за ${defaultDateFormat}`,
        // html: await generateHtmlFromThemplate(payment),
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

    expect(response.status).toHaveBeenCalledWith(400)
  })
})
