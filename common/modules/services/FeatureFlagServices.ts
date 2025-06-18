import FeatureFlag from '@modules/models/FeatureFlag'

class FeatureFlagService {
  static async getAll() {
    return FeatureFlag.find()
  }

  static async create(data: {
    name: string
    description: string
    isEnabled: boolean
  }) {
    const existing = await FeatureFlag.findOne({ name: data.name })
    if (existing) {
      throw new Error('Feature flag already exists')
    }
    return await FeatureFlag.create(data)
  }

  static async update(
    id: string,
    data: Partial<{
      name: string
      description: string
      isEnabled: boolean
    }>
  ) {
    return FeatureFlag.findByIdAndUpdate(id, data, { new: true })
  }
  static async delete(id: string) {
    return FeatureFlag.findByIdAndDelete(id)
  }
  static async getByid(id: string) {
    return FeatureFlag.findById(id)
  }
  static async getByName(name: string) {
    return FeatureFlag.findOne({ name })
  }

  static async isFeatureEnabled(name: string): Promise<boolean> {
    const flag = await FeatureFlag.findOne({ name })
    return !!flag?.isEnabled
  }
}

export default FeatureFlagService
