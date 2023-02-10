import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IPaymentModel {
  _id?: ObjectId
  date: Date
  credit: string
  debit: string
  description: string
}

const PaymentSchema = new Schema<IPaymentModel>({
  date: { type: Date, required: true },
  credit: { type: String, required: true, default: '0' },
  debit: { type: String, required: true, default: '0' },
  description: { type: String, required: true },
})

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
export default Payment
