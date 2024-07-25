import mongoose, { ObjectId, Schema } from 'mongoose'

export interface ICreditModel {
  domain: ObjectId
  date: Date
  sum: number
  description: string
}

export const CreditSchema = new Schema<ICreditModel>({
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  date: { type: Date, required: true },
  sum: { type: Number, required: true, default: 0 },
  description: { type: String, required: false, default: '' },
})

const Credit =
  (mongoose.models.Credit as mongoose.Model<ICreditModel>) ||
  mongoose.model('Credit', CreditSchema)

export default Credit
