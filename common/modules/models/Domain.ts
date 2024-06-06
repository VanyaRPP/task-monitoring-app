import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IDomain {
  _id: ObjectId | string
  name: string
  adminEmails: [string]
  streets: [ObjectId]
  description: string
}

const DomainSchema = new Schema<IDomain>({
  name: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  streets: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Street' }],
    required: true,
  },
  description: { type: String, required: true },
})

const Domain =
  (mongoose.models?.Domain as mongoose.Model<IDomain>) ||
  mongoose.model('Domain', DomainSchema)

export default Domain
