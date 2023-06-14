import mongoose, { ObjectId, Schema } from 'mongoose'
import { IPaymentTableData, IRentTableData } from '@utils/tableData'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
export interface IPaymentModel {
  index: number
  type: string
  date: Date
  domain: ObjectId
  street: ObjectId
  company: ObjectId
  monthService: ObjectId
  invoice: IPaymentField[]
  description?: string
  services?: IPaymentTableData[]
  generalSum: number
}

export const PaymentSchema = new Schema<IPaymentModel>({
  index: { type: Number, required: true },
  type: { type: String },
  date: { type: Date, required: true, default: Date.now() },
  domain: { type: Schema.Types.ObjectId, ref: 'Domain' },
  street: { type: Schema.Types.ObjectId, ref: 'Street' },
  company: { type: Schema.Types.ObjectId, ref: 'RealEstate' },
  monthService: { type: Schema.Types.ObjectId, ref: 'Service' },
  description: { type: String },
  invoice: { type: [Object] },
  services: { type: [Object] },
  generalSum: { type: Number },
})

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

export default Payment
