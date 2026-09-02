import mongoose, { Schema, Types, Document, Model } from 'mongoose'
import { Currency } from '@utils/constants'

export interface ProfitDocument extends Document {
  domain: Types.ObjectId
  payment?: Types.ObjectId
  createdBy?: Types.ObjectId
  amount: number
  type: 'debit' | 'credit' // 'debit' = витрата (-), 'credit' = прибуток (+)
  categories?: string[]
  description?: string
  invoiceNumber?: string
  /** When the money actually moved. */
  date: Date
  /**
   * `YYYY-MM` - which month this expense BELONGS to, which is often not the
   * month it was paid in (June utilities settled in July). Absent on older
   * records; readers fall back to the month of `date`.
   */
  periodMonth?: string
  /** ISO code; defaults to UAH for records created before multi-currency. */
  currency?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Profit:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "66484d19762f2b1c5ac6a7c2"
 *         domain:
 *           type: string
 *           description: Domain ID
 *           example: "66484d19762f2b1c5ac6a7c2"
 *         payment:
 *           type: string
 *           nullable: true
 *           description: Related payment ID
 *           example: "66484d19762f2b1c5ac6a7c3"
 *         amount:
 *           type: number
 *           example: 500
 *         type:
 *           type: string
 *           enum: [credit, debit]
 *           description: credit = income, debit = expense
 *           example: "credit"
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           example: ["salary", "bonus"]
 *         description:
 *           type: string
 *           example: "Bonus for project delivery"
 *         invoiceNumber:
 *           type: string
 *           example: "INV-2024-001"
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-06-01"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const ProfitSchema = new Schema<ProfitDocument>(
  {
    domain: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      required: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: false,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    description: { type: String },
    invoiceNumber: { type: String },
    date: { type: Date, required: true },
    periodMonth: {
      type: String,
      required: false,
      match: /^\d{4}-\d{2}$/,
    },
    currency: { type: String, required: false, default: Currency.UAH },
  },
  {
    timestamps: true,
  }
)

const Profit =
  (mongoose.models?.Profit as Model<ProfitDocument>) ||
  mongoose.model<ProfitDocument>('Profit', ProfitSchema)

export default Profit
