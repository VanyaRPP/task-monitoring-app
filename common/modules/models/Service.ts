import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IServiceModel {
  domain: ObjectId
  street: ObjectId
  rentPrice: number
  date: Date
  electricityPrice: number
  waterPrice: number
  waterPriceTotal: number
  garbageCollectorPrice: number
  inflicionPrice: number
  description: string
  customServices: {
    _id: ObjectId
    label: string
    fieldName: string
    price: number
  }[]
  losses?: number
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
  inflicionPrice: { type: Number, required: false, default: 0 },
  description: { type: String, required: false, default: '' },
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
  losses: { type: Number, required: false, default: 0 },
})

const Service =
  (mongoose.models.Service as mongoose.Model<IServiceModel>) ||
  mongoose.model('Service', ServiceSchema)

export default Service
