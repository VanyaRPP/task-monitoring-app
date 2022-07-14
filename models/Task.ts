import mongoose, { Schema, ObjectId } from 'mongoose'

export interface ITask {
  _id?: string
  name: string
  creator?: ObjectId | string
  desription?: string
  domain?: any
  category?: string
  dateofcreate: Date
  deadline: string
}

const TaskShema = new Schema<ITask>({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User' },
  desription: { type: String, default: 'no description' },
  domain: { type: String },
  category: { type: String },
  dateofcreate: { type: Date, required: true, default: Date.now },
  deadline: { type: String, required: true },
})

const Task = mongoose.models.Task || mongoose.model('Task', TaskShema)
export default Task
