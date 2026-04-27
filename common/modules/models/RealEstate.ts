import mongoose, { ObjectId, Schema } from 'mongoose'
import { Currency } from '@utils/constants'
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
  currency?: string
  rentPart?: number
  waterPart?: number
  cleaning?: number
  discount?: number
  inflicion?: boolean
  garbageCollector?: boolean
  archived?: boolean
  account?: string
  rnokpp?: string
  defaultTemplate?: string
  services: IDomainService[]
  customServices?: ICustomService[]
}
interface ICustomService {
  _id: ObjectId
  fieldName: string
  label: string
  price: number
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
  currency: { type: String, required: false, default: Currency.UAH },
  rentPart: { type: Number, required: true, default: 0 },
  waterPart: { type: Number, required: true, default: 0 },
  cleaning: { type: Number, required: false, default: 0 },
  discount: { type: Number, required: false, default: 0 },
  inflicion: { type: Boolean, required: false, default: false },
  garbageCollector: { type: Boolean, required: false, default: false },
  archived: { type: Boolean, required: false, default: false },
  account: { type: String, required: false, default: '' },
  rnokpp: { type: String, required: false, default: '' },
  defaultTemplate: { type: String, required: false },
  services: { type: [Object] },
  customServices: {
    type: [
      {
        _id: { type: Schema.Types.ObjectId, ref: 'CustomService' },
        label: { type: String, required: true },
        fieldName: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    required: false,
    default: [],
  },
})

const RealEstate =
  (mongoose.models?.RealEstate as mongoose.Model<IRealEstateModel>) ||
  mongoose.model('RealEstate', RealEstateSchema)

export default RealEstate
