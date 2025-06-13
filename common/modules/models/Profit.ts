import mongoose, { Schema, Types, Document, Model } from 'mongoose'

export interface ProfitDocument extends Document {
  domain: Types.ObjectId
  payment: Types.ObjectId
  amount: number
  type: 'debit' | 'credit' // 'debit' = витрата (-), 'credit' = прибуток (+)
  categories?: string[]
  description?: string
  invoiceNumber?: string
  date: Date
  createdAt?: Date
  updatedAt?: Date
}

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
      required: true,
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
  },
  {
    timestamps: true,
  }
)

const Profit =
  (mongoose.models?.Profit as Model<ProfitDocument>) ||
  mongoose.model<ProfitDocument>('Profit', ProfitSchema)

export default Profit
