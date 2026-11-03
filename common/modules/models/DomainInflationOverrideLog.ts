import mongoose, { Schema, Types } from 'mongoose'

export type DomainInflationOverrideAction = 'set' | 'reset'

export interface IDomainInflationOverrideLog {
  _id?: string
  domain: Types.ObjectId | string
  year: number
  month: number
  action: DomainInflationOverrideAction
  before: number | null
  after: number | null
  actorEmail?: string
  actorId?: Types.ObjectId | string
  date: Date
}

const DomainInflationOverrideLogSchema =
  new Schema<IDomainInflationOverrideLog>({
    domain: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    action: { type: String, enum: ['set', 'reset'], required: true },
    before: { type: Number, default: null },
    after: { type: Number, default: null },
    actorEmail: { type: String, required: false },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    date: { type: Date, required: true },
  })

DomainInflationOverrideLogSchema.index({
  domain: 1,
  year: 1,
  month: 1,
  date: -1,
})

const DomainInflationOverrideLog: mongoose.Model<IDomainInflationOverrideLog> =
  mongoose.models?.DomainInflationOverrideLog ||
  mongoose.model<IDomainInflationOverrideLog>(
    'DomainInflationOverrideLog',
    DomainInflationOverrideLogSchema
  )

export default DomainInflationOverrideLog
