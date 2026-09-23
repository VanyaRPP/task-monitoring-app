import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import handler from '@pages/api/domain/by-service-type'
import { HOUSING_FEE_SERVICE_ID, ServiceType } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const DOMAIN_CLONED = '111111111111111111111111'
const DOMAIN_LEGACY = '222222222222222222222222'
const GLOBAL_SERVICE = '333333333333333333333333'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

/** `CustomService.find` викликається двічі: спершу scoped, потім глобальні. */
const mockCustomServiceFind = (scoped: unknown[], global: unknown[]) =>
  (CustomService.find as jest.Mock).mockImplementation((filter: any) => ({
    lean: jest
      .fn()
      .mockResolvedValue(filter?.domain === null ? global : scoped),
  }))

const mockDomainFind = (docs: unknown[]) =>
  (Domain.find as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue(docs),
  })

const get = (type: string) => ({ method: 'GET', query: { type } }) as any

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })
})

describe('GET /api/domain/by-service-type', () => {
  it('знаходить домен за клонованою послугою з serviceType', async () => {
    mockCustomServiceFind([{ domain: DOMAIN_CLONED }], [])
    mockDomainFind([])
    const res = makeRes()

    await handler(get(ServiceType.HousingFee), res)

    expect(CustomService.find).toHaveBeenCalledWith(
      { serviceType: ServiceType.HousingFee, domain: { $ne: null } },
      'domain'
    )
    expect(res.json.mock.calls[0][0].data).toEqual([DOMAIN_CLONED])
  })

  it('знаходить старий домен, що посилається на фіксований id квартплати', async () => {
    mockCustomServiceFind([], [])
    mockDomainFind([{ _id: DOMAIN_LEGACY }])
    const res = makeRes()

    await handler(get(ServiceType.HousingFee), res)

    expect(Domain.find).toHaveBeenCalledWith(
      { 'customServices.services': { $in: [HOUSING_FEE_SERVICE_ID] } },
      '_id'
    )
    expect(res.json.mock.calls[0][0].data).toEqual([DOMAIN_LEGACY])
  })

  it('додає глобальні послуги того ж типу до пошуку за посиланням', async () => {
    mockCustomServiceFind([], [{ _id: GLOBAL_SERVICE }])
    mockDomainFind([{ _id: DOMAIN_LEGACY }])
    const res = makeRes()

    await handler(get(ServiceType.HousingFee), res)

    expect(Domain.find).toHaveBeenCalledWith(
      {
        'customServices.services': {
          $in: [HOUSING_FEE_SERVICE_ID, GLOBAL_SERVICE],
        },
      },
      '_id'
    )
  })

  it('об’єднує обидва шляхи без дублів', async () => {
    mockCustomServiceFind(
      [{ domain: DOMAIN_CLONED }, { domain: DOMAIN_LEGACY }],
      []
    )
    mockDomainFind([{ _id: DOMAIN_LEGACY }])
    const res = makeRes()

    await handler(get(ServiceType.HousingFee), res)

    expect(res.json.mock.calls[0][0].data).toEqual([
      DOMAIN_CLONED,
      DOMAIN_LEGACY,
    ])
  })

  it('порожній список, коли послуги немає в жодному домені', async () => {
    mockCustomServiceFind([], [])
    mockDomainFind([])
    const res = makeRes()

    await handler(get(ServiceType.HousingFee), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].data).toEqual([])
  })

  it('відмовляє не-адміну', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
    const res = makeRes()

    await handler(get(ServiceType.HousingFee), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(CustomService.find).not.toHaveBeenCalled()
  })

  it.each([
    ['невідомий тип', 'nonsense'],
    ['custom', ServiceType.Custom],
    ['порожній', ''],
  ])('відхиляє %s', async (_label, type) => {
    const res = makeRes()

    await handler(get(type), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(CustomService.find).not.toHaveBeenCalled()
  })

  it('віддає 405 на інший метод', async () => {
    const res = makeRes()

    await handler({ method: 'POST', query: {} } as any, res)

    expect(res.status).toHaveBeenCalledWith(405)
  })
})
