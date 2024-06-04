import { IStreet } from '@common/modules/models/Street'
import mongoose, { Schema } from 'mongoose'

export interface IDomain extends mongoose.Document {
  name: string
  adminEmails: string[]
  streets: IStreet[]
  description?: string
}

const DomainSchema = new Schema<IDomain>({
  name: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  streets: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Street' }],
    required: true,
  },
  description: { type: String, required: false },
})

const Domain =
  (mongoose.models.Domain as mongoose.Model<IDomain>) ||
  mongoose.model('Domain', DomainSchema)

export default Domain
