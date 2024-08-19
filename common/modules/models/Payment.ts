import {
  IPaymentField,
  IProvider,
  IReciever,
} from '@common/api/paymentApi/payment.api.types'
import mongoose, { Schema } from 'mongoose'
import { IDomain } from './Domain'
import { IRealEstate } from './RealEstate'
import { IService } from './Service'
import { IStreet } from './Street'

export interface IPayment {
  _id: string
  invoiceNumber: number
  type: 'debit' | 'credit'
  invoiceCreationDate: Date
  domain: IDomain
  street: IStreet
  company: IRealEstate
  monthService: IService
  description?: string
  invoice: IPaymentField[]
  provider: IProvider // can be acquired from `this.domain` maybe?
  reciever: IReciever // can be acquired from `this.company` maybe?
  generalSum: number
}

export type PaymentModelType = mongoose.Document & Omit<IPayment, '_id'>

export const PaymentSchema = new Schema<PaymentModelType>({
  invoiceNumber: { type: Number, required: true },
  type: { type: String, required: true },
  invoiceCreationDate: { type: Date, required: true, default: Date.now() },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  street: { type: Schema.Types.ObjectId, ref: 'Street', required: true },
  company: { type: Schema.Types.ObjectId, ref: 'RealEstate', required: true },
  monthService: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  description: { type: String },
  invoice: { type: [Object] },
  provider: { type: Object },
  reciever: { type: Object },
  generalSum: { type: Number },
})

const Payment =
  (mongoose.models.Payment as mongoose.Model<PaymentModelType>) ||
  mongoose.model('Payment', PaymentSchema)

export default Payment
