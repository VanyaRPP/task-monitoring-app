import { ICustomer } from '@common/api/customerApi/customer.api.types'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { IAddress } from '@modules/models/Task'
import mongoose, { ObjectId, Schema } from 'mongoose'
import { ITask } from './Task'

export interface IUser {
  _id?: ObjectId | string
  name: string
  email: string
  image?: string
  roles?: string[]
  tasks?: [ITask]
  payments?: [IPayment]
  services?: [IService]
  customers?: [ICustomer]
  rating?: number
  feedback?: [IFeedback]
  isWorker: boolean
  tel?: string
  address?: IAddress
  password?: string
}
export interface IFeedback {
  id: string
  grade: number
  text: string
}

export interface IPermissions {
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
  isUser: boolean
  isAdmin: boolean
}

const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: {
    type: String,
    default: 'https://avatars.githubusercontent.com/u/583231?v=4',
  },
  roles: { type: [String], default: ['User'] },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  customers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
  rating: { type: Number, default: 0 },
  feedback: [{ type: Object }],
  isWorker: { type: Boolean, default: false },
  tel: { type: String },
  address: { type: Object },
  password: { type: String },
})

const User =
  (mongoose?.models?.User as mongoose.Model<IUser>) ||
  mongoose?.model('User', UserSchema)

export default User
