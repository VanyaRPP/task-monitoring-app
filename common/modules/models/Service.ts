import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import mongoose, { Schema } from 'mongoose'

export interface IService extends mongoose.Document {
  domain: IDomain
  street: IStreet
  rentPrice: number
  date: Date
  electricityPrice: number
  waterPrice: number
  waterPriceTotal: number
  garbageCollectorPrice?: number
  inflicionPrice?: number
  description?: string
}

export const ServiceSchema = new Schema<IService>({
  date: { type: Date, required: true },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  rentPrice: { type: Number, required: true, default: 0 },
  electricityPrice: { type: Number, required: true, default: 0 },
  waterPrice: { type: Number, required: true, default: 0 },
  waterPriceTotal: { type: Number, required: true, default: 0 },
  garbageCollectorPrice: { type: Number, required: false, default: 0 },
  inflicionPrice: { type: Number, required: false, default: 0 },
  description: { type: String, required: false },
})

const Service =
  (mongoose.models.Service as mongoose.Model<IService>) ||
  mongoose.model('Service', ServiceSchema)

export default Service
