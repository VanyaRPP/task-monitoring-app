import mongoose, { ObjectId, Schema } from 'mongoose'
import { IDomainService } from './Domain'

export interface IRealEstateModel {
  domain: ObjectId
  street: ObjectId
  companyName: string
  description: string
  adminEmails: string[]
  pricePerMeter: number
  servicePricePerMeter?: number
  totalArea?: number
  rentPart?: number
  waterPart?: number
  cleaning?: number
  discount?: number
  inflicion?: boolean
  garbageCollector?: boolean
  archived?: boolean
  services: IDomainService[]
}

export const RealEstateSchema = new Schema<IRealEstateModel>({
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  companyName: { type: String, required: true },
  description: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  pricePerMeter: { type: Number, required: true, default: 0 },
  servicePricePerMeter: { type: Number, required: false },
  totalArea: { type: Number, required: true, default: 0 },
  rentPart: { type: Number, required: true, default: 0 },
  waterPart: { type: Number, required: true, default: 0 },
  cleaning: { type: Number, required: false, defailt: 0 },
  discount: { type: Number, required: false, default: 0 },
  inflicion: { type: Boolean, required: false, default: false },
  garbageCollector: { type: Boolean, required: false, default: false },
  archived: { type: Boolean, required: false, default: false },
  services: { type: [Object] },
})

const RealEstate =
  (mongoose.models?.RealEstate as mongoose.Model<IRealEstateModel>) ||
  mongoose.model('RealEstate', RealEstateSchema)

export default RealEstate
