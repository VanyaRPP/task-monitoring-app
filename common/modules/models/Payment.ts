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

export interface IPayment extends mongoose.Document {
  invoiceNumber: number
  type: 'debit' | 'credit'
  invoiceCreationDate: Date
  domain: IDomain
  street: IStreet
  company: IRealEstate
  monthService: IService
  description?: string
  invoice: IPaymentField[]
  provider: IProvider // can be acquired from `.domain`
  reciever: IReciever // can be acquired from `.company`
  generalSum: number
}

export const PaymentSchema = new Schema<IPayment>({
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
  (mongoose.models.Payment as mongoose.Model<IPayment>) ||
  mongoose.model('Payment', PaymentSchema)

export default Payment
