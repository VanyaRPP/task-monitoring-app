import mongoose, { Schema } from 'mongoose'

/**
 * Офіційний місячний індекс споживчих цін (ІСЦ) Держстату.
 *
 * Це ГЛОБАЛЬНИЙ довідник, а не властивість домену. Не плутати з
 * `Service.inflicionPrice`: той живе на місячній послузі конкретного
 * домену+вулиці й керує рядком «Індекс інфляції» у звичайному рахунку. Тут —
 * державна статистика, однакова для всіх, з якої рахується індексація боргу за
 * ст. 625 ЦК.
 */
export interface IInflationIndex {
  _id?: string
  year: number
  /** Номер місяця, 1–12. */
  month: number
  /** ІСЦ, %: `100.8` означає +0.8% до попереднього місяця. */
  value: number
}

const InflationIndexSchema = new Schema<IInflationIndex>({
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  value: { type: Number, required: true, min: 0 },
})

InflationIndexSchema.index({ year: 1, month: 1 }, { unique: true })

const InflationIndex =
  (mongoose.models?.InflationIndex as mongoose.Model<IInflationIndex>) ||
  mongoose.model('InflationIndex', InflationIndexSchema)

export default InflationIndex
