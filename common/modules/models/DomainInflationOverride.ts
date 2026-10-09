import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IDomainInflationOverride {
  _id?: string
  domain: ObjectId | string
  year: number
  month: number
  value: number
  updatedBy?: string
  updatedAt?: Date
}

const DomainInflationOverrideSchema = new Schema<IDomainInflationOverride>({
  domain: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  value: { type: Number, required: true },
  updatedBy: { type: String, required: false },
  updatedAt: { type: Date, required: false },
})

DomainInflationOverrideSchema.index(
  { domain: 1, year: 1, month: 1 },
  { unique: true }
)

const DomainInflationOverride =
  (mongoose.models
    ?.DomainInflationOverride as mongoose.Model<IDomainInflationOverride>) ||
  mongoose.model('DomainInflationOverride', DomainInflationOverrideSchema)

export default DomainInflationOverride
