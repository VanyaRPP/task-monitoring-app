import mongoose, { Schema } from 'mongoose'

export interface ICallback {
  _id?: string
  name: string
  email: string
  message?: string
}

const CallBackSchema = new Schema<ICallback>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String },
})

const CallBack: mongoose.Model<ICallback> =
  mongoose.models?.CallBack ||
  mongoose.model<ICallback>('CallBack', CallBackSchema)

export default CallBack
