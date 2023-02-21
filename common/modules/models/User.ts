import { IAddress } from 'common/modules/models/Task'
import { ITask } from './Task'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import mongoose, { ObjectId, Schema } from 'mongoose'
import Payment from './Payment'

export interface IUser {
  _id?: ObjectId | string
  name: string
  email: string
  image?: string
  role?: string
  tasks?: [ITask]
  payments?: [IPayment]
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

const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  image: {
    type: String,
    default: 'https://avatars.githubusercontent.com/u/583231?v=4',
  },
  role: { type: String, default: 'User' },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
  rating: { type: Number, default: 0 },
  feedback: [{ type: Object }],
  isWorker: { type: Boolean, default: false },
  tel: { type: String },
  address: { type: Object },
  password: { type: String },
})

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model('User', UserSchema)

export default User
