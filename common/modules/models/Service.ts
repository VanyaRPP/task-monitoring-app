import { Moment } from 'moment'
import mongoose, { Schema } from 'mongoose'

export interface IServiceModel {
  rentPrice: number
  date: Moment
  electricityPrice: number
  waterPrice: number
  inflicionPrice: number
  description: string
}

export const ServiceSchema = new Schema<IServiceModel>({
  date: { type: Date, required: true },
  rentPrice: { type: Number, required: true, default: 0 },
  electricityPrice: { type: Number, required: true, default: 0 },
  waterPrice: { type: Number, required: true, default: 0 },
  inflicionPrice: { type: Number, required: true, default: 0 },
  description: { type: String, required: true },
})

const Service =
  mongoose.models.Service || mongoose.model('Service', ServiceSchema)

export default Service
