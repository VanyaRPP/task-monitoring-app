import mongoose, { Schema, ObjectId } from 'mongoose'
import { IGeoCode } from './Task'

export interface IDomain {
  _id: ObjectId
  name: string
  creator?: ObjectId | string
  tasks?: [ObjectId | string]
  users?: [ObjectId | string]
  area: IGeoCode[]
}

const DomainSchema = new Schema<IDomain>({
  name: { type: String, required: true },
  creator: { type: String },
  tasks: { type: String },
  users: { type: String },
  area: [{ type: Object }],
})

const Domain = mongoose.models.Domain || mongoose.model('Domain', DomainSchema)
export default Domain
