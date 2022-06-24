import mongoose, { Schema, Types, model } from 'mongoose'

export interface ITask {
  name: string;
  creator: any;
  desription?: string;
  domain?: string;
  category?: any;
  dateofcreate: Date;
  deadline: Date;
  // organization: Types.ObjectId;
}

const TaskShema = new Schema<ITask>({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User' },
  desription: { type: String, default:'no description' },
  domain: { type: String },
  category: { type: String },
  dateofcreate: { type: Date, required: true, default: Date.now },
  deadline: { type: Date, required: true },
})

const Task = mongoose.models.Task || mongoose.model("Task", TaskShema);
export default Task

// module.exports = mongoose.models.Task || mongoose.model("Task", TaskShema);