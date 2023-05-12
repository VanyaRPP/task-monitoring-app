import mongoose, { HydratedDocument, Schema } from 'mongoose'
export interface IStreet {
  _id?: string
  adress: string
}

const StreetSchema = new Schema<IStreet>({
  adress: { type: String, required: true },
})

const Street = mongoose.models.Street || mongoose.model('Street', StreetSchema)

export default Street
