import mongoose, { ObjectId, Schema } from 'mongoose'
import { IPaymentTableData, IRentTableData } from '@utils/tableData'

export interface IPaymentModel {
  type: string
  date: Date
  domain: ObjectId
  street: ObjectId
  company: ObjectId
  service: ObjectId
  credit: number
  debit: number
  electricity: IPaymentTableData
  water: IPaymentTableData
  placing: IPaymentTableData
  maintenance: IPaymentTableData
  description?: string
  services?: IPaymentTableData[]
}

export const PaymentSchema = new Schema<IPaymentModel>({
  type: { type: String },
  date: { type: Date, required: true, default: Date.now() },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  company: { type: Schema.Types.ObjectId, ref: 'RealEstate' },
  service: { type: Schema.Types.ObjectId, ref: 'Service' },
  credit: { type: Number, required: true, default: 0 },
  debit: { type: Number, required: true, default: 0 },
  description: { type: String },
  maintenance: { type: Object },
  placing: { type: Object },
  electricity: { type: Object },
  water: { type: Object },
  services: { type: [Object] },
})

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

export default Payment
