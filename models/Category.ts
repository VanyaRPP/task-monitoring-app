import mongoose, { Schema, Types, model, ObjectId } from 'mongoose'

export interface ICategory {
  _id: ObjectId
  name: string
  desription?: string
  taskincategory: []
}

const CategoryShema = new Schema<ICategory>({
  name: { type: String, required: true },
  taskincategory: [{ type: Schema.Types.ObjectId, ref: 'Task', default: [] }],
  desription: { type: String, default: 'no description' },
})

const Category =
  mongoose.models.Category || mongoose.model('Category', CategoryShema)
export default Category
