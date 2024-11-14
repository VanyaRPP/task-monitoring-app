import mongoose, { Schema } from 'mongoose'

export interface ICreditModel {
  date: Date
  sum: number
  description: string
}

export const CreditSchema = new Schema<ICreditModel>({
  date: { type: Date, required: true },
  sum: { type: Number, required: true, default: 0 },
  description: { type: String, required: false, default: '' },
})

const Credit =
  (mongoose.models.Credit as mongoose.Model<ICreditModel>) ||
  mongoose.model('Credit', CreditSchema)

export default Credit
