import mongoose, { Document, Schema } from 'mongoose'

export interface IFeatureFlag extends Document {
  name: string
  description?: string
  isEnabled: boolean
  createdAt: Date
}

/**
 * @swagger
 * components:
 *   schemas:
 *     FeatureFlag:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64c2ab3d4f2e4c7b1f8a5678"
 *         name:
 *           type: string
 *           description: Unique name of the feature flag
 *           example: "new_dashboard"
 *         description:
 *           type: string
 *           description: Optional description of the feature flag
 *           example: "Enable the new dashboard UI"
 *         isEnabled:
 *           type: boolean
 *           description: Whether the feature is enabled or not
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the feature flag was created
 *           example: "2024-06-01T12:00:00.000Z"
 */
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
