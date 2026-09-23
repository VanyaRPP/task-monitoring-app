import mongoose, { ObjectId, Schema } from 'mongoose'
import { IApartmentOverrides } from '@utils/debt-calculation/build-input'
import { IYearMonth } from '@utils/debt-calculation/months'
import { InflationMethod } from '@utils/debt-calculation/types'

/**
 * Збережений розрахунок заборгованості.
 *
 * Зберігаємо ЛИШЕ вхідні дані — період, налаштування і ручні правки. Тіло
 * боргу, річні та інфляційні перераховуються при відкритті: довідник ІСЦ
 * дописується щомісяця, і старий розрахунок має підхопити нові індекси, а не
 * показувати законсервовану суму.
 */
export interface IDebtCalculationModel {
  _id?: string
  name: string
  domain: ObjectId | string
  periodFrom?: IYearMonth
  periodTo?: IYearMonth
  annualRatePercent?: number
  inflationMethod: InflationMethod
  /** `{ companyId: { ...правки квартири, months: { 'YYYY-MM': {...} } } }` */
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
    name: { type: String, required: true, trim: true },
    domain: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
    periodFrom: { type: YearMonthSchema, required: false },
    periodTo: { type: YearMonthSchema, required: false },
    annualRatePercent: { type: Number, required: false },
    inflationMethod: {
      type: String,
      enum: ['balance', 'monthly'],
      default: 'balance',
    },
    // Mixed: форма правок залежить від набору квартир і місяців, схемою її не
    // описати. Межа довіри — `sanitizeSnapshot` в API-роуті.
    overrides: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
)

DebtCalculationSchema.index({ domain: 1, updatedAt: -1 })

const DebtCalculation =
  (mongoose.models?.DebtCalculation as mongoose.Model<IDebtCalculationModel>) ||
  mongoose.model<IDebtCalculationModel>(
    'DebtCalculation',
    DebtCalculationSchema
  )

export default DebtCalculation
