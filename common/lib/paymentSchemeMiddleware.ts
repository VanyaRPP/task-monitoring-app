import { PaymentSchema } from '@common/modules/models/Payment'
import User from '@common/modules/models/User'

export const paymentSchemeMiddleware = () => {
  PaymentSchema.pre('save', async function (next) {
    try {
      const user = await User.findById(this.payer)
      if (user) {
        user.payments.push(this._id as any)
        await user.save()
      }
      next()
    } catch (err) {
      next(err)
    }
  })
}
