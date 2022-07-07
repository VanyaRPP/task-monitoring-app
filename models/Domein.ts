import mongoose, { Schema, ObjectId } from 'mongoose'

export interface IDomein {
  _id: ObjectId
  name: string
  creator?: ObjectId | string
  tasks?: [ObjectId | string]
  users?: [ObjectId | string]
}

const DomeinShema = new Schema<IDomein>({
  name: { type: String, required: true },
})

const Domein =
  mongoose.models.Category || mongoose.model('Category', DomeinShema)
export default Domein
