import mongoose, { Schema, ObjectId } from 'mongoose'
import {
  IPaymentField,
  IPaymentSnapshot,
  IProvider,
  IReciever,
  PaymentActionType,
  PaymentMutationSource,
} from '@common/api/paymentApi/payment.api.types'

export interface IPaymentChangeLogModel {
  paymentId: ObjectId

  date: Date
  reason?: string

  actorId?: ObjectId
  actorEmail?: string

  actionType: PaymentActionType
  source: PaymentMutationSource

  before?: IPaymentSnapshot
  after?: IPaymentSnapshot

  domainId?: ObjectId
  companyId?: ObjectId
  batchId?: ObjectId

  invoiceData: {
    invoiceNumber: number
    invoiceCreationDate: Date
    invoice: IPaymentField[]
    provider: IProvider
    reciever: IReciever
    generalSum: number
    description?: string
    type: string
    currency?: string
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

    actionType: {
      type: String,
      enum: [
        'CREATE',
        'BULK_CREATE',
        'UPDATE',
        'DELETE',
        'BULK_DELETE',
        'MARK_PAID',
        'RESTORE',
      ],
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: ['single', 'bulk', 'quick-pay', 'admin-restore'],
      required: true,
    },

    before: {
      type: Object,
    },

    after: {
      type: Object,
    },

    domainId: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      index: true,
    },

    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'RealEstate',
    },

    batchId: {
      type: Schema.Types.ObjectId,
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
      currency: { type: String },
    },
  },
  { timestamps: true }
)

const PaymentChangeLog =
  (mongoose.models
    .PaymentChangeLog as mongoose.Model<IPaymentChangeLogModel>) ||
  mongoose.model('PaymentChangeLog', PaymentChangeLogSchema)

export default PaymentChangeLog
