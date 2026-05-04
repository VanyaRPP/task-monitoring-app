import mongoose, { ObjectId, Schema } from 'mongoose'
import { ServiceType } from '@utils/constants'

export interface ICustomServiceModel {
  name: string
  fieldName: string
  domain: ObjectId
  serviceType?: ServiceType | string
  _id?: string
  _v: number
}

export const CustomServiceSchema = new Schema<ICustomServiceModel>({
  name: { type: String, required: true },
  fieldName: { type: String, required: true },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  serviceType: {
    type: String,
    enum: [...Object.values(ServiceType), null],
    required: false,
    default: undefined,
  },
})

const CustomService =
  mongoose.models.CustomService ||
  mongoose.model('CustomService', CustomServiceSchema)

export default CustomService
