import mongoose, { Schema, ObjectId } from 'mongoose'
import { ITask } from './Task'

export interface ICallback {
  _id?: string
  name: string
  email: string
  phone?: string
  description?: string

}

const CallBackSchema = new Schema<ICallback>({
  name: { type: String, required: true },
})

const CallBack = mongoose.models.Category || mongoose.model('CallBack', CallBackSchema)
export default CallBack
