import mongoose, { Schema } from 'mongoose'

export interface ICustomDomainTypeTemplate {
  _id: string
  typeLabel: string
  groupName: string
}

const CustomDomainTypeTemplateSchema = new Schema<ICustomDomainTypeTemplate>(
  {
    typeLabel: { type: String, required: true, trim: true },
    groupName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

CustomDomainTypeTemplateSchema.index(
  { typeLabel: 1, groupName: 1 },
  { unique: true }
)

const CustomDomainTypeTemplate =
  (mongoose.models?.CustomDomainTypeTemplate as mongoose.Model<ICustomDomainTypeTemplate>) ||
  mongoose.model<ICustomDomainTypeTemplate>(
    'CustomDomainTypeTemplate',
    CustomDomainTypeTemplateSchema
  )

export default CustomDomainTypeTemplate
