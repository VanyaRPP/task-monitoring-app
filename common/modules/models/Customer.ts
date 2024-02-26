import mongoose, { ObjectId, Schema } from 'mongoose'
import { IUser } from './User'

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

const Customer =
  mongoose.models?.Customer || mongoose.model('Customer', CustomerSchema)

export default Customer
