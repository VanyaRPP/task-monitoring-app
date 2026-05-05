import mongoose, { Schema, Types } from 'mongoose'

export type DomainTypeTemplateCategory =
  | 'utility'
  | 'it'
  | 'edu'
  | 'auto'
  | 'real-estate'
  | 'other'

export const DOMAIN_TYPE_TEMPLATE_CATEGORIES: DomainTypeTemplateCategory[] = [
  'utility',
  'it',
  'edu',
  'auto',
  'real-estate',
  'other',
]

export interface IDomainTypeTemplateGroup {
  groupName: string
  serviceIds: Types.ObjectId[]
}

export interface IDomainTypeTemplate {
  _id: Types.ObjectId
  name: string
  category: DomainTypeTemplateCategory
  isBuiltIn: boolean
  groups: IDomainTypeTemplateGroup[]
  createdBy?: Types.ObjectId
  archivedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

const DomainTypeTemplateGroupSchema = new Schema<IDomainTypeTemplateGroup>(
  {
    groupName: { type: String, required: true, trim: true },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'CustomService' }],
  },
  { _id: false }
)

const DomainTypeTemplateSchema = new Schema<IDomainTypeTemplate>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: {
      type: String,
      enum: DOMAIN_TYPE_TEMPLATE_CATEGORIES,
      default: 'other',
      required: true,
    },
    isBuiltIn: { type: Boolean, default: false },
    groups: { type: [DomainTypeTemplateGroupSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const DomainTypeTemplate =
  (mongoose.models?.DomainTypeTemplate as mongoose.Model<IDomainTypeTemplate>) ||
  mongoose.model<IDomainTypeTemplate>(
    'DomainTypeTemplate',
    DomainTypeTemplateSchema
  )

export default DomainTypeTemplate
