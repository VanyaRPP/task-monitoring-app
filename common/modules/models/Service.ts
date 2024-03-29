import { Moment } from 'moment'
import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IServiceModel {
  domain: ObjectId
  street: ObjectId
  rentPrice: number
  date: Moment
  electricityPrice: number
  waterPrice: number
  waterPriceTotal: number
  garbageCollectorPrice: number
  publicElectricUtilityPrice: number
  inflicionPrice: number
  description: string
}

export const ServiceSchema = new Schema<IServiceModel>({
  date: { type: Date, required: true },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  rentPrice: { type: Number, required: true, default: 0 },
  electricityPrice: { type: Number, required: true, default: 0 },
  waterPrice: { type: Number, required: true, default: 0 },
  waterPriceTotal: { type: Number, required: true, default: 0 },
  garbageCollectorPrice: { type: Number, required: false, default: 0 },
  publicElectricUtilityPrice: { type: Number, required: false, default: 0 },
  inflicionPrice: { type: Number, required: false, default: 0 },
  description: { type: String, required: false, default: '' },
})

const Service =
  mongoose.models.Service || mongoose.model('Service', ServiceSchema)

export default Service
