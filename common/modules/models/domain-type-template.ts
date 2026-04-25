import mongoose, { Schema, Types } from 'mongoose'

export interface IDomainTypeTemplateGroup {
  groupName: string
  serviceIds: Types.ObjectId[]
}

export interface IDomainTypeTemplate {
  _id: Types.ObjectId
  name: string
  isBuiltIn: boolean
  groups: IDomainTypeTemplateGroup[]
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
    isBuiltIn: { type: Boolean, default: false },
    groups: { type: [DomainTypeTemplateGroupSchema], default: [] },
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
