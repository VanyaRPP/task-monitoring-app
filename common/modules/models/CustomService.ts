import mongoose, { ObjectId, Schema } from 'mongoose'

export interface ICustomServiceModel {
  name: string
  fieldName: string
  domain: ObjectId
  _id?: string
  _v: number
}

export const CustomServiceSchema = new Schema<ICustomServiceModel>({
  name: { type: String, required: true },
  fieldName: { type: String, required: true },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
})

const CustomService =
  mongoose.models.CustomService ||
  mongoose.model('CustomService', CustomServiceSchema)

export default CustomService
