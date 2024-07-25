import { IStreet } from '@common/modules/models/Street'
import mongoose, { Schema } from 'mongoose'

export interface IDomain {
  _id: string
  name: string
  adminEmails: [string]
  streets: [IStreet]
  description: string
}

const DomainSchema = new Schema<IDomain>({
  name: { type: String, required: true },
  adminEmails: { type: [String], required: true, default: [] },
  streets: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Street' }],
    required: true,
    default: [],
  },
  description: { type: String, required: true },
})

const Domain =
  (mongoose.models?.Domain as mongoose.Model<IDomain>) ||
  mongoose.model('Domain', DomainSchema)

export default Domain
