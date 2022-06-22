import mongoose, { Schema, Types, model } from 'mongoose'
import { User } from '../models/User'

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
  desription: { type: String, required: true, default:'no description' },
  domain: { type: String },
  category: { type: String },
  dateofcreate: { type: Date, required: true, default: Date.now },
  deadline: { type: Date, required: true },
})

module.exports = mongoose.models.Task || mongoose.model("Task", TaskShema);