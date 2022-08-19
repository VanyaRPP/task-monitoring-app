import mongoose, { Schema } from 'mongoose'

export interface INotification {
  _id?: string
  isSeen: boolean
  userId: Schema.Types.ObjectId | string
  url: string
  text: string
  timestamp: Date
}

const NotificationSchema = new Schema<INotification>({
  isSeen: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String },
  text: { type: String },
  timestamp: { type: Date, default: new Date() },
})

const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', NotificationSchema)
export default Notification
