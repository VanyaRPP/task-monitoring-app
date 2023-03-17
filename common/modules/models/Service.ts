import { IUser } from './User'
//import { serviceSchemeMiddleware } from '@common/lib/serviceSchemeMiddleware'
import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IServiceModel {
  orenda: number
  date: Date
  electricPrice: number
  waterPrice: number
  inflaPrice: number
  description: string
}

export const ServiceSchema = new Schema<IServiceModel>({
  orenda: { type: Number, required: true, default: 0 },
  date: { type: Date, required: true, default: Date.now() },
  electricPrice: { type: Number, required: true, default: 0 },
  waterPrice: { type: Number, required: true, default: 0 },
  inflaPrice: { type: Number, required: true, default: 0 },
  description: { type: String, required: true },
})

//serviceSchemeMiddleware()

const Service =
  mongoose.models.Service || mongoose.model('Service', ServiceSchema)

export default Service
