import { Schema, model, Types } from 'mongoose'

export interface ProfitDocument {
  _id?: Types.ObjectId
  domain: Types.ObjectId
  amount: number
  type: 'debit' | 'credit' // 'debit' = витрата (-), 'credit' = прибуток (+)
  categories?: string[]
  description?: string
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
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['debit', 'credit'], // debit = -, credit = +
      required: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    description: { type: String },
    date: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
)

export const ProfitModel = model<ProfitDocument>('Profit', ProfitSchema)
