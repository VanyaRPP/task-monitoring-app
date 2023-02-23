import { paymentSchemeMiddleware } from '@common/lib/paymentSchemeMiddleware'
import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IPaymentModel {
  payer: ObjectId
  date: Date
  credit: number
  debit: number
  description: string
}

export const PaymentSchema = new Schema<IPaymentModel>({
  payer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  credit: { type: Number, required: true, default: 0 },
  debit: { type: Number, required: true, default: 0 },
  description: { type: String, required: true },
})

paymentSchemeMiddleware()

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

export default Payment
