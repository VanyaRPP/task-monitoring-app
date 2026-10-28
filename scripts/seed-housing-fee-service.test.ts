import CustomService from '../common/modules/models/CustomService'
import DomainTypeTemplate from '../common/modules/models/domain-type-template'
import { HOUSING_FEE_SERVICE_ID, ServiceType } from '../utils/constants'
import {
  HOUSING_FEE_SERVICE_NAME,
  HOUSING_FEE_TEMPLATE,
  seedHousingFeeService,
} from './seed-housing-fee-service'

jest.mock('../common/modules/models/CustomService', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    create: jest.fn(),
  },
}))

jest.mock('../common/modules/models/domain-type-template', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  },
}))

/** A template the seed has already set up correctly. */
const seededTemplate = {
  _id: 'tpl',
  name: 'Квартплата',
  category: 'real-estate',
  groups: [{ groupName: 'Квартплата', serviceIds: [HOUSING_FEE_SERVICE_ID] }],
}

const mockService = (doc: unknown) =>
  (CustomService.findById as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue(doc),
  })

const mockTemplate = (doc: unknown) =>
  (DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue(doc),
  })

beforeEach(() => {
  jest.clearAllMocks()
})

describe('HOUSING_FEE_TEMPLATE', () => {
  it('сидиться в категорію real-estate і несе саме послугу квартплати', () => {
    expect(HOUSING_FEE_TEMPLATE.category).toBe('real-estate')
    expect(HOUSING_FEE_TEMPLATE.groups).toHaveLength(1)
    expect(HOUSING_FEE_TEMPLATE.groups[0].serviceIds).toEqual([
      HOUSING_FEE_SERVICE_ID,
    ])
  })
})

describe('seedHousingFeeService', () => {
  it('створює послугу з фіксованим _id і типом квартплати', async () => {
    mockService(null)
    mockTemplate(null)
    ;(CustomService.create as jest.Mock).mockResolvedValue({})
    ;(DomainTypeTemplate.create as jest.Mock).mockResolvedValue({})

    const report = await seedHousingFeeService()

    expect(CustomService.create).toHaveBeenCalledTimes(1)
    const created = (CustomService.create as jest.Mock).mock.calls[0][0]
    expect(String(created._id)).toBe(HOUSING_FEE_SERVICE_ID)
    expect(created).toEqual(
      expect.objectContaining({
        name: HOUSING_FEE_SERVICE_NAME,
        fieldName: ServiceType.HousingFee,
        serviceType: ServiceType.HousingFee,
      })
    )
    // A global catalog service - not bound to any domain.
    expect(created.domain).toBeUndefined()
    expect(report.serviceCreated).toBe(true)
  })

  it('створює шаблон real-estate, що посилається на цю послугу', async () => {
    mockService(null)
    mockTemplate(null)
    ;(CustomService.create as jest.Mock).mockResolvedValue({})
    ;(DomainTypeTemplate.create as jest.Mock).mockResolvedValue({})

    const report = await seedHousingFeeService()

    expect(DomainTypeTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Квартплата',
        category: 'real-estate',
        isBuiltIn: true,
      })
    )
    const { groups } = (DomainTypeTemplate.create as jest.Mock).mock.calls[0][0]
    expect(groups[0].serviceIds.map(String)).toEqual([HOUSING_FEE_SERVICE_ID])
    expect(report.templates.created).toEqual(['Квартплата'])
  })

  it('ідемпотентний: нічого не створює на повторному запуску', async () => {
    mockService({ _id: HOUSING_FEE_SERVICE_ID })
    mockTemplate(seededTemplate)

    const report = await seedHousingFeeService()

    expect(CustomService.create).not.toHaveBeenCalled()
    expect(DomainTypeTemplate.create).not.toHaveBeenCalled()
    expect(report.serviceCreated).toBe(false)
    expect(report.templates.skipped).toEqual(['Квартплата'])
  })

  it('досіює шаблон, якщо послуга вже є, а шаблону немає', async () => {
    mockService({ _id: HOUSING_FEE_SERVICE_ID })
    mockTemplate(null)
    ;(DomainTypeTemplate.create as jest.Mock).mockResolvedValue({})

    const report = await seedHousingFeeService()

    expect(CustomService.create).not.toHaveBeenCalled()
    expect(report.serviceCreated).toBe(false)
    expect(report.templates.created).toEqual(['Квартплата'])
  })
})

describe('seedHousingFeeService — чужий шаблон із тією ж назвою', () => {
  /** Exactly what turned up in the DB: hand-made, empty, wrong category. */
  const handMade = {
    _id: 'tpl',
    name: 'Квартплата',
    category: 'utility',
    isBuiltIn: false,
    groups: [{ groupName: 'Квартплата', serviceIds: [] }],
  }

  it('не мовчить, а позначає шаблон як невідповідний', async () => {
    mockService({ _id: HOUSING_FEE_SERVICE_ID })
    mockTemplate(handMade)

    const report = await seedHousingFeeService()

    expect(DomainTypeTemplate.updateOne).not.toHaveBeenCalled()
    expect(report.templates.mismatched).toEqual(['Квартплата'])
    expect(report.templates.skipped).toEqual([])
  })

  it('каже, чого саме бракує', async () => {
    mockService({ _id: HOUSING_FEE_SERVICE_ID })
    mockTemplate(handMade)
    const lines: string[] = []

    await seedHousingFeeService({}, (msg) => lines.push(msg))

    const warning = lines.find((line) => line.includes('УВАГА'))
    expect(warning).toContain(HOUSING_FEE_SERVICE_ID)
    expect(warning).toContain('utility')
    expect(warning).toContain('--repair')
  })

  it('з --repair доливає послугу й виправляє категорію', async () => {
    mockService({ _id: HOUSING_FEE_SERVICE_ID })
    mockTemplate(handMade)
    ;(DomainTypeTemplate.updateOne as jest.Mock).mockResolvedValue({})

    const report = await seedHousingFeeService({ repair: true })

    expect(report.templates.repaired).toEqual(['Квартплата'])
    const [filter, update] = (DomainTypeTemplate.updateOne as jest.Mock).mock
      .calls[0]
    expect(filter).toEqual({ _id: 'tpl' })
    expect(update.$set.category).toBe('real-estate')
    expect(update.$set.isBuiltIn).toBe(true)
    expect(update.$set.groups[0].serviceIds.map(String)).toEqual([
      HOUSING_FEE_SERVICE_ID,
    ])
  })

  it('репар не затирає те, що дописали руками', async () => {
    const OTHER = '677d414283b6ef93c6b8ea2c'
    mockService({ _id: HOUSING_FEE_SERVICE_ID })
    mockTemplate({
      ...handMade,
      groups: [
        { groupName: 'Своя група', serviceIds: [OTHER] },
        { groupName: 'Квартплата', serviceIds: [] },
      ],
    })
    ;(DomainTypeTemplate.updateOne as jest.Mock).mockResolvedValue({})

    await seedHousingFeeService({ repair: true })

    const { groups } = (DomainTypeTemplate.updateOne as jest.Mock).mock
      .calls[0][1].$set
    expect(groups).toHaveLength(2)
    expect(groups[0].serviceIds.map(String)).toEqual([OTHER])
    expect(groups[1].serviceIds.map(String)).toEqual([HOUSING_FEE_SERVICE_ID])
  })
})
