import initMiddleware from '@common/lib/initMiddleware'
import validateMiddleware from '@common/lib/validateMiddleware'
import { check, validationResult } from 'express-validator'
import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IPaymentModel {
  _id?: ObjectId
  date: Date
  credit: number
  debit: number
  description: string
}

const PaymentSchema = new Schema<IPaymentModel>({
  date: { type: Date, required: true },
  credit: { type: Number, required: true, default: 0 },
  debit: { type: Number, required: true, default: 0 },
  description: { type: String, required: true },
})

export const postValidateBody = initMiddleware(
  validateMiddleware(
    [
      check('date'),
      check('credit').isInt({ min: 1, max: 10000 }).optional(),
      check('debit').isInt({ min: 1, max: 10000 }).optional(),
      check('description').trim(),
    ],
    validationResult
  )
)

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
export default Payment
