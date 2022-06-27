
import mongoose, { Schema, Types, model, ObjectId } from 'mongoose'

export interface ITask {
  _id: ObjectId;
  name: string;
  creator: ObjectId;
  desription?: string;
  domain?: string;
  category?: any;
  dateofcreate: Date;
  deadline: Date;
}

const TaskShema = new Schema<ITask>({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User' },
  desription: { type: String, default: 'no description' },
  domain: { type: String },
  category: { type: String },
  dateofcreate: { type: Date, required: true, default: Date.now },
  deadline: { type: Date, required: true },
})

const Task = mongoose.models.Task || mongoose.model("Task", TaskShema);
export default Task