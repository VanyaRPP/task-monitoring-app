import handler from './index'
import Service from '@modules/models/Service'
import Payment from '@modules/models/Payment'
import { getFormattedDate } from '@assets/features/formatDate'

jest.mock('@modules/models/Service', () => ({
  distinct: jest.fn(),
  aggregate: jest.fn(),
}))

jest.mock('@modules/models/Payment', () => ({
  distinct: jest.fn(),
  aggregate: jest.fn(),
}))

jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@assets/features/formatDate', () => ({
  getFormattedDate: jest.fn((date) => {
    const months = [
      'Січень',
      'Лютий',
      'Березень',
      'Квітень',
      'Травень',
      'Червень',
      'Липень',
      'Серпень',
      'Вересень',
      'Жовтень',
      'Листопад',
      'Грудень',
    ]
    return months[date.getMonth()]
  }),
}))

describe('API Filter Date Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('має повертати фільтри років та місяців для Service за замовчуванням', async () => {
    ;(Service.distinct as jest.Mock).mockReturnValue(
      Promise.resolve([new Date('2023-01-01'), new Date('2024-05-01')])
    )
    ;(Service.aggregate as jest.Mock).mockReturnValue(
      Promise.resolve([{ _id: { month: 1 } }, { _id: { month: 5 } }])
    )

    const req = {
      method: 'GET',
      query: {
        domainId: 'domain_123',
        streetId: 'street_456',
      },
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(Service.distinct).toHaveBeenCalledWith(
      'date',
      expect.objectContaining({
        domain: { $in: ['domain_123'] },
        street: { $in: ['street_456'] },
      })
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const responseData = res.json.mock.calls[0][0]

    expect(responseData.success).toBe(true)

    expect(responseData.yearFilter).toContainEqual({
      value: 2023,
      text: '2023',
    })
    expect(responseData.yearFilter).toContainEqual({
      value: 2024,
      text: '2024',
    })

    expect(responseData.monthFilter).toContainEqual({
      value: 1,
      text: 'Січень',
    })
    expect(responseData.monthFilter).toContainEqual({
      value: 5,
      text: 'Травень',
    })
  })

  it('має використовувати модель Payment та поле invoiceCreationDate, якщо type === "payment"', async () => {
    ;(Payment.distinct as jest.Mock).mockReturnValue(
      Promise.resolve([new Date('2022-10-10')])
    )
    ;(Payment.aggregate as jest.Mock).mockReturnValue(
      Promise.resolve([{ _id: { month: 10 } }])
    )

    const req = {
      method: 'GET',
      query: { type: 'payment' },
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(Payment.distinct).toHaveBeenCalledWith('invoiceCreationDate', {})
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        yearFilter: [{ value: 2022, text: '2022' }],
        monthFilter: [{ value: 10, text: 'Жовтень' }],
      })
    )
  })

  it('має повертати 405 для методів, відмінних від GET', async () => {
    const req = { method: 'POST' }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
  })
})
