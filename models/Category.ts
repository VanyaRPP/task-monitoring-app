import mongoose, { Schema, ObjectId } from 'mongoose'
import { ITask } from './Task';

export interface ICategory {
  _id: ObjectId;
  name: string;
  desription?: string;
  taskincategory?: [ITask | ObjectId];
}

const CategoryShema = new Schema<ICategory>({
  name: { type: String, required: true },
  taskincategory: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  desription: { type: String, default: 'no description' },
})

const Category = mongoose.models.Category || mongoose.model("Category", CategoryShema);
export default Category