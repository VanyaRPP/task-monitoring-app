import mongoose, { Schema } from 'mongoose'
import { IUser } from './User'

export interface INotification {
  _id?: string
  isSeen: boolean
  user: IUser
  url: string
  text: string
}

const NotificationSchema = new Schema<INotification>({
  isSeen: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String },
  text: { type: String },
})

const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', NotificationSchema)
export default Notification
