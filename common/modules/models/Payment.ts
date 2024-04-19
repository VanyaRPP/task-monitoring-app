import {
  IPaymentField,
  IProvider,
  IReciever,
} from '@common/api/paymentApi/payment.api.types'
import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IPaymentModel {
  invoiceNumber: number
  type: string
  invoiceCreationDate: Date
  domain: ObjectId
  street: ObjectId
  company: ObjectId
  monthService: ObjectId | string
  invoice: IPaymentField[]
  description?: string
  provider: IProvider
  reciever: IReciever
  generalSum: number
}

export const PaymentSchema = new Schema<IPaymentModel>({
  invoiceNumber: { type: Number, required: true },
  type: { type: String },
  invoiceCreationDate: { type: Date, required: true, default: Date.now() },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  company: { type: Schema.Types.ObjectId, ref: 'RealEstate' },
  monthService: { type: Schema.Types.Mixed, ref: 'Service' },
  description: { type: String },
  invoice: { type: [Object] },
  provider: { type: Object },
  reciever: { type: Object },
  generalSum: { type: Number },
})

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

export default Payment
