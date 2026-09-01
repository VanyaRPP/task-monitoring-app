import {
  IPaymentField,
  IPaymentTransactions,
  IProvider,
  IReciever,
  PaymentStatus,
} from '@common/api/paymentApi/payment.api.types'
import mongoose, { ObjectId, Schema } from 'mongoose'
import { Currency } from '@utils/constants'

export interface IPaymentModel {
  invoiceNumber: number
  type: string
  status?: PaymentStatus
  invoiceCreationDate: Date
  /**
   * When the money actually arrived. Set on `credit` payments created by
   * mark-paid. Absent on older records and on `debit` invoices - readers must
   * fall back to `invoiceCreationDate`.
   */
  paidAt?: Date
  domain: ObjectId
  street: ObjectId
  company: ObjectId
  monthService: ObjectId | string
  invoice: IPaymentField[]
  description?: string
  provider: IProvider
  reciever: IReciever
  generalSum: number
  currency?: string
  transaction: IPaymentTransactions
  losses?: number
  template?: string
  invoiceLang?: 'en' | 'uk'
}

export const PaymentSchema = new Schema<IPaymentModel>({
  invoiceNumber: { type: Number, required: true },
  type: { type: String },
  status: {
    type: String,
    enum: [PaymentStatus.Draft, PaymentStatus.Sent],
    default: PaymentStatus.Draft,
  },
  invoiceCreationDate: { type: Date, required: true, default: Date.now },
  paidAt: { type: Date, required: false },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  company: { type: Schema.Types.ObjectId, ref: 'RealEstate' },
  monthService: { type: Schema.Types.Mixed, ref: 'Service' },
  description: { type: String },
  invoice: { type: [Object] },
  provider: { type: Object },
  reciever: { type: Object },
  generalSum: { type: Number },
  currency: { type: String, required: false, default: Currency.UAH },
  transaction: { type: Object },
  losses: { type: Number },
  template: {
    type: String,
    default: 'classic',
  },
  invoiceLang: {
    type: String,
    enum: ['en', 'uk'],
    required: false,
  },
})

const Payment =
  (mongoose.models?.Payment as mongoose.Model<IPaymentModel>) ||
  mongoose.model('Payment', PaymentSchema)

export default Payment
