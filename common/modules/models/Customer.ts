import { IUser } from './User'
import mongoose, { ObjectId, Schema } from 'mongoose'

export interface ICustomerModel {
  customer: ObjectId | IUser
  locations?: string
  information?: string
  description?: string
}

export const CustomerSchema = new Schema<ICustomerModel>({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  locations: { type: String, required: true },
  information: { type: String, required: true },
  description: { type: String, required: true },
})

const Customer: mongoose.Model<ICustomerModel> =
  mongoose.models?.Customer ||
  mongoose.model<ICustomerModel>('Customer', CustomerSchema)

export default Customer
