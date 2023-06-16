import mongoose, { ObjectId, Schema } from 'mongoose'
import { IPaymentTableData, IRentTableData } from '@utils/tableData'

export interface IPaymentModel {
  domain: ObjectId
  street: ObjectId
  company: ObjectId
  date: Date
  credit: number
  debit: number
  maintenance?: IPaymentTableData
  rentPrice?: IRentTableData
  electricityPrice?: IPaymentTableData
  waterPrice?: IPaymentTableData
  description?: string
  services?: IPaymentTableData[]
}

export const PaymentSchema = new Schema<IPaymentModel>({
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  company: { type: Schema.Types.ObjectId, ref: 'RealEstate' },
  date: { type: Date, required: true, default: Date.now() },
  credit: { type: Number, required: true, default: 0 },
  description: { type: String },
  debit: { type: Number, required: true, default: 0 },
  maintenance: { type: Object },
  rentPrice: { type: Object },
  electricityPrice: { type: Object },
  waterPrice: { type: Object },
  services: { type: [Object] },
})

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

export default Payment
