import mongoose, { ObjectId, Schema } from 'mongoose'
import { IApartmentOverrides } from '@utils/debt-calculation/build-input'
import { IYearMonth } from '@utils/debt-calculation/months'
import { InflationMethod } from '@utils/debt-calculation/types'

/**
 * A persisted debt calculation.
 *
 * ONLY inputs are stored - the period, the settings and the manual edits. The
 * principal, the interest and the inflation losses are recomputed on open: the
 * CPI table gains a row every month, and an old calculation must pick the new
 * indices up rather than show a frozen figure.
 *
 * There is one record per (domain, company) pair, kept current by autosave -
 * there are no longer separate named "saved calculations".
 */
export interface IDebtCalculationModel {
  _id?: string
  name?: string
  domain: ObjectId | string
  /** The company the calculation belongs to - the autosave key. */
  company: ObjectId | string
  periodFrom?: IYearMonth
  periodTo?: IYearMonth
  annualRatePercent?: number
  inflationMethod: InflationMethod
  /** `{ companyId: { ...company edits, months: { 'YYYY-MM': {...} } } }` */
  overrides: Record<string, IApartmentOverrides>
  createdBy?: ObjectId | string
  createdAt?: Date
  updatedAt?: Date
}

const YearMonthSchema = new Schema<IYearMonth>(
  {
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
  },
  { _id: false }
)

const DebtCalculationSchema = new Schema<IDebtCalculationModel>(
  {
    name: { type: String, required: false, trim: true },
    domain: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'RealEstate',
      required: true,
    },
    periodFrom: { type: YearMonthSchema, required: false },
    periodTo: { type: YearMonthSchema, required: false },
    annualRatePercent: { type: Number, required: false },
    inflationMethod: {
      type: String,
      enum: ['balance', 'monthly'],
      default: 'balance',
    },
    // Mixed: the shape of the edits depends on which companies and months are
    // involved, so a schema cannot describe it. The trust boundary is
    // `sanitizeSnapshot` in the API route.
    overrides: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
)

// One autosaved calculation per company: that is exactly what the page shows,
// and an upsert on this pair makes saving seamless - no names, no buttons.
DebtCalculationSchema.index({ domain: 1, company: 1 }, { unique: true })

const DebtCalculation =
  (mongoose.models?.DebtCalculation as mongoose.Model<IDebtCalculationModel>) ||
  mongoose.model<IDebtCalculationModel>(
    'DebtCalculation',
    DebtCalculationSchema
  )

export default DebtCalculation
