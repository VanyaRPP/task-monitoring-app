import { Moment } from 'moment'
import mongoose, { Schema } from 'mongoose'

export interface IRealEstateModel {
  address: string
  description: string
  adminEmails: string[]
  pricePerMeter: number
  servicePricePerMeter: number
  totalArea: number
  garbageCollector: number
}

export const RealEstateSchema = new Schema<IRealEstateModel>({
  address: { type: String, required: true },
  description: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  pricePerMeter: { type: Number, required: true, default: 0 },
  servicePricePerMeter: { type: Number, required: true, default: 0 },
  totalArea: { type: Number, required: true, default: 0 },
  garbageCollector: { type: Number, required: true, default: 0 },
})

const RealEstate =
  mongoose.models.RealEstate || mongoose.model('RealEstate', RealEstateSchema)

export default RealEstate
