import mongoose, { Document, Schema } from 'mongoose'

export interface IFeatureFlag extends Document {
  name: string
  description?: string
  isEnabled: boolean
  createdAt: Date
}

const FeatureFlagSchema = new Schema<IFeatureFlag>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const FeatureFlag =
  (mongoose.models.FeatureFlag as mongoose.Model<IFeatureFlag>) ||
  mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema)

export default FeatureFlag
