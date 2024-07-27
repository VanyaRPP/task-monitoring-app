import { IStreet } from '@common/modules/models/Street'
import mongoose, { Schema } from 'mongoose'

export interface IDomain {
  _id: string
  name: string
  adminEmails: string[]
  streets: IStreet[]
  description?: string
}

export type DomainModelType = Omit<IDomain, '_id'> & mongoose.Document

const DomainSchema = new Schema<DomainModelType>({
  name: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  streets: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Street' }],
    required: true,
  },
  description: { type: String, required: false },
})

const Domain =
  (mongoose.models?.Domain as mongoose.Model<DomainModelType>) ||
  mongoose.model('Domain', DomainSchema)

export default Domain
