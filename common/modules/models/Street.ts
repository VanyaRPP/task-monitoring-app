import mongoose, { Schema } from 'mongoose'
export interface IStreet {
  _id?: string
  address: string
}

const StreetSchema = new Schema<IStreet>({
  address: { type: String, required: true },
})

const Street = mongoose.models.Street || mongoose.model('Street', StreetSchema)

export default Street
