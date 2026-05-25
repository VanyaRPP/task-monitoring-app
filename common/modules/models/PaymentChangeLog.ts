import mongoose, { Schema, ObjectId } from 'mongoose'
import {
  IPaymentField,
  IProvider,
  IReciever,
} from '@common/api/paymentApi/payment.api.types'

export interface IPaymentChangeLogModel {
  paymentId: ObjectId

  date: Date
  reason?: string

  actorId?: ObjectId
  actorEmail?: string

  invoiceData: {
    invoiceNumber: number
    invoiceCreationDate: Date
    invoice: IPaymentField[]
    provider: IProvider
    reciever: IReciever
    generalSum: number
    description?: string
    type: string
  }
}

const PaymentChangeLogSchema = new Schema<IPaymentChangeLogModel>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    reason: {
      type: String,
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    actorEmail: {
      type: String,
    },

    invoiceData: {
      invoiceNumber: { type: Number, required: true },
      invoiceCreationDate: { type: Date, required: true },
      invoice: { type: [Object], required: true },
      provider: { type: Object, required: true },
      reciever: { type: Object, required: true },
      generalSum: { type: Number, required: true },
      description: { type: String },
      type: { type: String, required: true },
    },
  },
  { timestamps: true }
)

const PaymentChangeLog =
  (mongoose.models
    .PaymentChangeLog as mongoose.Model<IPaymentChangeLogModel>) ||
  mongoose.model('PaymentChangeLog', PaymentChangeLogSchema)

export default PaymentChangeLog
