import mongoose, { ObjectId, Schema } from 'mongoose'
import { IDomain } from './Domain'

export interface IRealEstateModel {
  domain: ObjectId | IDomain
  // TODO: Street WIP as ObjectId
  street: string
  companyName: string
  bankInformation: string
  agreement: string
  phone: string
  adminEmails: string[]
  pricePerMeter: number
  servicePricePerMeter: number
  totalArea: number
  garbageCollector: number
}

export const RealEstateSchema = new Schema<IRealEstateModel>({
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  // TODO: Street WIP as ObjectId
  // streetId: [{ type: Schema.Types.ObjectId, ref: 'Street' }],
  street: { type: String, required: true },
  companyName: { type: String, required: true },
  bankInformation: { type: String, required: true },
  agreement: { type: String, required: true },
  phone: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  pricePerMeter: { type: Number, required: true, default: 0 },
  servicePricePerMeter: { type: Number, required: true, default: 0 },
  totalArea: { type: Number, required: true, default: 0 },
  garbageCollector: { type: Number, required: true, default: 0 },
})

const RealEstate =
  mongoose.models.RealEstate || mongoose.model('RealEstate', RealEstateSchema)

export default RealEstate
