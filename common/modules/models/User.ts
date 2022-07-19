import { ITask } from './Task'
import mongoose, { Schema, Types, model, ObjectId } from 'mongoose'

export interface IUser {
  _id?: string
  name: string
  email: string
  image?: string
  role?: string
  tasks?: [ITask]
  rating?: number
}

const UserShema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  image: String,
  role: { type: String, default: 'User' },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  rating: { type: Number, default: 0 },
})

const User = mongoose.models.User || mongoose.model('User', UserShema)
export default User
