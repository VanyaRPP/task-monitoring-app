import { ITask } from './Task'
import mongoose, { Schema } from 'mongoose'
import { ObjectId } from 'mongodb'

export interface IUser {
  _id?: string
  name: string
  email: string
  image?: string
  role?: string
  tasks?: [ITask]
  feedback?: [IFeedback]
  isWorker: boolean
  tel?: string
}

export interface IFeedback {
  id: string
  grade: number
  text: string
}

const UserShema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  image: String,
  role: { type: String, default: 'User' },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  feedback: [{ type: Object }],
  isWorker: { type: Boolean, default: false },
  tel: { type: String },
})

const User = mongoose.models.User || mongoose.model('User', UserShema)
export default User
