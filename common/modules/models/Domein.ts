import mongoose, { Schema, ObjectId } from 'mongoose'

export interface IDomein {
  _id: ObjectId
  name: string
  creator?: ObjectId | string
  tasks?: [ObjectId | string]
  users?: [ObjectId | string]
  arera: object
}

const DomeinShema = new Schema<IDomein>({
  name: { type: String, required: true },
  creator: { type: String },
  tasks: { type: String },
  users: { type: String },
})

const Domein =
  mongoose.models.Category || mongoose.model('Category', DomeinShema)
export default Domein
