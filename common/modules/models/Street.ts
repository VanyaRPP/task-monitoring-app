import mongoose, { Schema } from 'mongoose'
export interface IStreet extends mongoose.Document {
  address: string
  city: string
}

const StreetSchema = new Schema<IStreet>({
  address: { type: String, required: true },
  city: { type: String, required: true },
})

const Street =
  (mongoose.models.Street as mongoose.Model<IStreet>) ||
  mongoose.model('Street', StreetSchema)

export default Street
