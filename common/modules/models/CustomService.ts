import mongoose, { Schema } from 'mongoose'

export interface ICustomServiceModel {
  name: string
  fieldName: string
  _id?: string
  _v: number
}

export const CustomServiceSchema = new Schema<ICustomServiceModel>({
  name: { type: String, required: true },
  fieldName: { type: String, required: true },
})

const CustomService =
  mongoose.models.CustomService ||
  mongoose.model('CustomService', CustomServiceSchema)

export default CustomService
