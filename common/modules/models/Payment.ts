import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IPaymentModel {
  _id?: ObjectId
  date: Date
  credit: number
  debit: number
  description: string
}

const PaymentSchema = new Schema<IPaymentModel>({
  date: { type: Date, required: true },
  credit: { type: Number, required: true, default: 0 },
  debit: { type: Number, required: true, default: 0 },
  description: { type: String, required: true },
})

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
export default Payment
