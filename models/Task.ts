import mongoose, { Schema, Types, model } from 'mongoose';

export interface ITask {
  name: string;
  creator: any;
  desription?: string;
  domain?: string;
  category?: any;
  dateofcreate: Date;
  deadline: string;
  // organization: Types.ObjectId;
}

const TaskShema = new Schema<ITask>({
  name: { type: String, required: true },
  creator: { type: String, required: true },
  desription: { type: String },
  domain: { type: String },
  category: { type: String },
  dateofcreate: { type: Date, required: true, default: Date.now },
  deadline: { type: String, required: true },
  // organization: { type: Schema.Types.ObjectId, ref: 'Organization' }
})

module.exports = mongoose.models.Task || mongoose.model("Task", TaskShema);