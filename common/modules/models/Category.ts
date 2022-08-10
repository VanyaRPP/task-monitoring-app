import mongoose, { Schema, ObjectId } from 'mongoose'
import { ITask } from './Task'

export interface ICategory {
  _id?: string
  name: string
  description?: string
  taskincategory?: [ITask | ObjectId]
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  taskincategory: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  description: { type: String, default: 'no description' },
})

const Category =
  mongoose.models.Category || mongoose.model('Category', CategorySchema)
export default Category
