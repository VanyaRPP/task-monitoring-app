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

  describe('update', () => {
    it('Оновлює фічефлаг', async () => {
      const id = '123'
      const updateData = {
        isEnabled: true,
      }
      const updatedFlag = {
        _id: id,
        name: 'test-flag',
        description: 'опис',
        isEnabled: true,
      }

      ;(FeatureFlag.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(
        updatedFlag
      )

      const result = await FeatureFlagService.update(id, updateData)

      expect(FeatureFlag.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        updateData,
        { new: true }
      )
      expect(result).toEqual(updatedFlag)
    })
  })

  describe('delete', () => {
    it('видаляє фічефлаг', async () => {
      const id = '123'
      const deletedFlag = {
        _id: id,
        name: 'test-flag',
      }

      ;(FeatureFlag.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(
        deletedFlag
      )

      const result = await FeatureFlagService.delete(id)

      expect(FeatureFlag.findByIdAndDelete).toHaveBeenCalledWith(id)
      expect(result).toEqual(deletedFlag)
    })
  })

  describe('getByid', () => {
    it('повертає фічефлаг за id', async () => {
      const id = '123'
      const mockFlag = {
        _id: id,
        name: 'test-flag',
      }

      ;(FeatureFlag.findById as jest.Mock).mockResolvedValueOnce(mockFlag)

      const result = await FeatureFlagService.getByid(id)

      expect(FeatureFlag.findById).toHaveBeenCalledWith(id)
      expect(result).toEqual(mockFlag)
    })
  })

  describe('getByName', () => {
    it('Повертає фічефлаг за name', async () => {
      const name = 'new-feature-flag-name'
      const mockFlag = {
        name: name,
        description: 'опис',
        isEnabled: true,
      }

      ;(FeatureFlag.findOne as jest.Mock).mockResolvedValueOnce(mockFlag)

      const result = await FeatureFlagService.getByName(name)

      expect(FeatureFlag.findOne).toHaveBeenCalledWith({ name })
      expect(result).toEqual(mockFlag)
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
