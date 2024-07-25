import FeatureFlag from '@modules/models/FeatureFlag'
import FeatureFlagService from '@common/services/FeatureFlagServices'
jest.mock('@modules/models/FeatureFlag')

describe('FeatureFlagService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('повертає список фічефлагів', async () => {
      const mockFlags = [{ name: 'flag1' }, { name: 'flag2' }]
      ;(FeatureFlag.find as jest.Mock).mockResolvedValueOnce(mockFlags)

      const result = await FeatureFlagService.getAll()

      expect(FeatureFlag.find).toHaveBeenCalled()
      expect(result).toEqual(mockFlags)
    })
  })

  describe('create', () => {
    it('створює флаг, якщо не існує', async () => {
      const mockData = {
        name: 'test-flag',
        description: 'опис',
        isEnabled: true,
      }

      ;(FeatureFlag.findOne as jest.Mock).mockResolvedValueOnce(null)
      ;(FeatureFlag.create as jest.Mock).mockResolvedValueOnce(mockData)

      const result = await FeatureFlagService.create(mockData)

      expect(FeatureFlag.findOne).toHaveBeenCalledWith({ name: 'test-flag' })
      expect(FeatureFlag.create).toHaveBeenCalledWith(mockData)
      expect(result).toEqual(mockData)
    })

    it('викидає помилку, якщо флаг вже існує', async () => {
      ;(FeatureFlag.findOne as jest.Mock).mockResolvedValueOnce({
        name: 'test-flag',
      })

      await expect(
        FeatureFlagService.create({
          name: 'test-flag',
          description: 'опис',
          isEnabled: true,
        })
      ).rejects.toThrow('Feature flag already exists')
    })
  })

  describe('isFeatureEnabled', () => {
    it('повертає true, якщо флаг увімкнено', async () => {
      ;(FeatureFlag.findOne as jest.Mock).mockResolvedValueOnce({
        isEnabled: true,
      })

      const result = await FeatureFlagService.isFeatureEnabled('some-flag')

      expect(result).toBe(true)
      expect(FeatureFlag.findOne).toHaveBeenCalledWith({ name: 'some-flag' })
    })

    it('повертає false, якщо флаг вимкнено', async () => {
      ;(FeatureFlag.findOne as jest.Mock).mockResolvedValueOnce({
        isEnabled: false,
      })

      const result = await FeatureFlagService.isFeatureEnabled('some-flag')

      expect(result).toBe(false)
    })

    it('повертає false, якщо флаг не знайдено', async () => {
      ;(FeatureFlag.findOne as jest.Mock).mockResolvedValueOnce(null)

      const result = await FeatureFlagService.isFeatureEnabled('some-flag')

      expect(result).toBe(false)
    })
  })
})
