import mongoose, { Schema } from 'mongoose'

/**
 * The official monthly consumer price index published by Derzhstat.
 *
 * This is a GLOBAL reference table, not a property of a domain. Do not confuse
 * it with `Service.inflicionPrice`, which lives on one domain+street monthly
 * service and drives the «Індекс інфляції» line of an ordinary invoice. What
 * is stored here is national statistics, identical for everyone, and it drives
 * debt indexation under art. 625 of the Civil Code.
 */
/**
 * Who wrote the value. `auto` rows come from the monthly cron's parser and are
 * unconfirmed until a person saves them; a wrong one would otherwise end up
 * silently backing a court claim. Rows seeded before this field existed have
 * no `source` at all and count as `manual`.
 */
export type InflationIndexSource = 'manual' | 'auto'

export interface IInflationIndex {
  _id?: string
  year: number
  /** Month number, 1-12. */
  month: number
  /** CPI, %: `100.8` means +0.8% against the previous month. */
  value: number
  source?: InflationIndexSource
}

const InflationIndexSchema = new Schema<IInflationIndex>({
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  value: { type: Number, required: true, min: 0 },
  source: { type: String, enum: ['manual', 'auto'], default: 'manual' },
})

InflationIndexSchema.index({ year: 1, month: 1 }, { unique: true })

const InflationIndex =
  (mongoose.models?.InflationIndex as mongoose.Model<IInflationIndex>) ||
  mongoose.model('InflationIndex', InflationIndexSchema)

export default InflationIndex
