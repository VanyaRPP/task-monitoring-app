import mongoose, { Schema, ObjectId } from 'mongoose'
import { IGeoCode } from './Task'

export interface IDomain {
  _id: ObjectId | string
  creator?: ObjectId | string
  tasks?: [ObjectId | string]
  users?: [ObjectId | string]
  area?: IGeoCode[]

  name: string
  address: string
  adminEmails: [string]
  streets: [ObjectId]
  description: string
  bankInformation: string
  phone: string
  email: string
}

const DomainSchema = new Schema<IDomain>({
  creator: { type: String },
  tasks: { type: String },
  users: { type: String },
  area: [{ type: Object }],

  name: { type: String, required: true },
  address: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  streets: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Street' }],
    required: true,
  },
  description: { type: String, required: true },
  bankInformation: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
})

const Domain = mongoose.models.Domain || mongoose.model('Domain', DomainSchema)
export default Domain
