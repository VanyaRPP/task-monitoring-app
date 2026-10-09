import mongoose, { Schema } from 'mongoose'

/**
 * A named, atomically incremented sequence - `findOneAndUpdate` with `$inc`
 * hands every caller its own value, even under concurrent requests. Used for
 * invoice numbers (`_id: 'invoiceNumber'`), see reserveInvoiceNumbers.
 */
export interface ICounter {
  _id: string
  /** The last value handed out. */
  seq: number
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
)

const Counter =
  (mongoose.models.Counter as mongoose.Model<ICounter>) ||
  mongoose.model<ICounter>('Counter', CounterSchema)

export default Counter
