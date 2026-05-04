// @ts-nocheck
import DomainTypeTemplate from '../common/modules/models/domain-type-template'
import { seedDomainTypeTemplates } from './seed-domain-type-templates'

jest.mock('../common/modules/models/domain-type-template', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('seedDomainTypeTemplates', () => {
  it('creates template that does not exist', async () => {
    ;(DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })
    ;(DomainTypeTemplate.create as jest.Mock).mockResolvedValue({})

    const report = await seedDomainTypeTemplates([
      { name: 'X', groups: [{ groupName: 'G', serviceIds: [] }] },
    ])

    expect(DomainTypeTemplate.create).toHaveBeenCalledTimes(1)
    expect(DomainTypeTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'X', isBuiltIn: true })
    )
    expect(report.created).toEqual(['X'])
    expect(report.skipped).toEqual([])
  })

  it('is idempotent: skips existing template on re-run', async () => {
    ;(DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'old', name: 'X' }),
    })

    const report = await seedDomainTypeTemplates([
      { name: 'X', groups: [{ groupName: 'G', serviceIds: [] }] },
    ])

    expect(DomainTypeTemplate.create).not.toHaveBeenCalled()
    expect(report.skipped).toEqual(['X'])
    expect(report.created).toEqual([])
  })

  it('drops invalid ObjectId service ids', async () => {
    ;(DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })
    ;(DomainTypeTemplate.create as jest.Mock).mockResolvedValue({})

    await seedDomainTypeTemplates([
      {
        name: 'Y',
        groups: [
          {
            groupName: 'G',
            serviceIds: ['not-an-id', '677d414283b6ef93c6b8ea2c'],
          },
        ],
      },
    ])

    const arg = (DomainTypeTemplate.create as jest.Mock).mock.calls[0][0]
    expect(arg.groups[0].serviceIds).toHaveLength(1)
  })

  it('handles mix of new and existing in one run', async () => {
    ;(DomainTypeTemplate.findOne as jest.Mock)
      .mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ _id: 'old', name: 'A' }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null),
      })
    ;(DomainTypeTemplate.create as jest.Mock).mockResolvedValue({})

    const report = await seedDomainTypeTemplates([
      { name: 'A', groups: [{ groupName: 'G', serviceIds: [] }] },
      { name: 'B', groups: [{ groupName: 'G', serviceIds: [] }] },
    ])

    expect(report.skipped).toEqual(['A'])
    expect(report.created).toEqual(['B'])
    expect(DomainTypeTemplate.create).toHaveBeenCalledTimes(1)
  })
})
