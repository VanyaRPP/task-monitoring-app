import { IUser } from './User'
import { paymentSchemeMiddleware } from '@common/lib/paymentSchemeMiddleware'
import mongoose, { ObjectId, Schema } from 'mongoose'
import { IPaymentTableData } from '@utils/tableData'

export interface IPaymentModel {
  payer: ObjectId | IUser
  date: Date
  credit: number
  debit: number
  maintenance?: IPaymentTableData
  placing?: IPaymentTableData
  electricity?: IPaymentTableData
  water?: IPaymentTableData
  description?: string
}

export const PaymentSchema = new Schema<IPaymentModel>({
  payer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now() },
  credit: { type: Number, required: true, default: 0 },
  description: { type: String },
  debit: { type: Number, required: true, default: 0 },
  maintenance: { type: Object },
  placing: { type: Object },
  electricity: { type: Object },
  water: { type: Object },
})

paymentSchemeMiddleware()

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

export default Payment
