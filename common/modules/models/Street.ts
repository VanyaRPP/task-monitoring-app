import mongoose, { Schema } from 'mongoose'
export interface IStreet {
  address: string
  city: string
  hasService?: boolean
  _id?: string
  _v: number
}

const StreetSchema = new Schema<IStreet>({
  address: { type: String, required: true },
  city: { type: String, required: true },
})

const Street =
  (mongoose.models.Street as mongoose.Model<IStreet>) ||
  mongoose.model('Street', StreetSchema)

export default Street
