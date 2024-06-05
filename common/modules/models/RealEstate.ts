import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import mongoose, { Schema } from 'mongoose'

export interface IRealEstate extends mongoose.Document {
  domain: IDomain
  street: IStreet
  companyName: string
  description?: string
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
}

export const RealEstateSchema = new Schema<IRealEstate>({
  domain: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  street: { type: Schema.Types.ObjectId, ref: 'Street', required: true },
  companyName: { type: String, required: true },
  description: { type: String, required: false },
  adminEmails: { type: [String], required: true, default: [] },
  pricePerMeter: { type: Number, required: true, default: 0 },
  servicePricePerMeter: { type: Number, required: false },
  totalArea: { type: Number, required: true, default: 0 },
  rentPart: { type: Number, required: true, default: 0 },
  waterPart: { type: Number, required: true, default: 0 },
  cleaning: { type: Number, required: false, defailt: 0 },
  discount: { type: Number, required: false, default: 0 },
  inflicion: { type: Boolean, required: false, default: false },
  garbageCollector: { type: Boolean, required: false, default: false },
})

const RealEstate =
  (mongoose.models.RealEstate as mongoose.Model<IRealEstate>) ||
  mongoose.model('RealEstate', RealEstateSchema)

export default RealEstate
