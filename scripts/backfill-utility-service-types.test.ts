import CustomService from '../common/modules/models/CustomService'
import { ServiceType } from '../utils/constants'
import { backfillUtilityServiceTypes } from './backfill-utility-service-types'

jest.mock('../common/modules/models/CustomService', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}))

const VALID_ID = '64d68421d9ba2fc8fea79d11'
const OTHER_ID = '74d68421d9ba2fc8fea79d22'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('backfillUtilityServiceTypes', () => {
  it('updates service when serviceType is missing', async () => {
    ;(CustomService.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: VALID_ID }),
    })
    ;(CustomService.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

    const report = await backfillUtilityServiceTypes({
      [VALID_ID]: ServiceType.Electricity,
    })

    expect(CustomService.findByIdAndUpdate).toHaveBeenCalledWith(VALID_ID, {
      serviceType: ServiceType.Electricity,
    })
    expect(report.updated).toEqual([VALID_ID])
  })

  it('is idempotent: skips when serviceType already correct', async () => {
    ;(CustomService.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        serviceType: ServiceType.Electricity,
      }),
    })

    const report = await backfillUtilityServiceTypes({
      [VALID_ID]: ServiceType.Electricity,
    })

    expect(CustomService.findByIdAndUpdate).not.toHaveBeenCalled()
    expect(report.unchanged).toEqual([VALID_ID])
  })

  it('overwrites when serviceType differs from canonical', async () => {
    ;(CustomService.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        serviceType: ServiceType.Custom,
      }),
    })
    ;(CustomService.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

    const report = await backfillUtilityServiceTypes({
      [VALID_ID]: ServiceType.Water,
    })

    expect(report.updated).toEqual([VALID_ID])
  })

  it('records missing record without crashing', async () => {
    ;(CustomService.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })

    const report = await backfillUtilityServiceTypes({
      [VALID_ID]: ServiceType.Water,
    })

    expect(report.missing).toEqual([VALID_ID])
    expect(CustomService.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it('skips invalid ObjectId', async () => {
    const report = await backfillUtilityServiceTypes({
      'not-an-id': ServiceType.Water,
    })
    expect(report.missing).toEqual(['not-an-id'])
    expect(CustomService.findById).not.toHaveBeenCalled()
  })

  it('handles mix of new + unchanged + missing', async () => {
    ;(CustomService.findById as jest.Mock)
      .mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ _id: VALID_ID }),
      })
      .mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({
          _id: OTHER_ID,
          serviceType: ServiceType.Maintenance,
        }),
      })
    ;(CustomService.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

    const report = await backfillUtilityServiceTypes({
      [VALID_ID]: ServiceType.Water,
      [OTHER_ID]: ServiceType.Maintenance,
    })

    expect(report.updated).toEqual([VALID_ID])
    expect(report.unchanged).toEqual([OTHER_ID])
  })
})
