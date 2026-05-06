import { ICustomer } from '@common/api/customerApi/customer.api.types'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { IAddress } from '@modules/models/Task'
import mongoose, { ObjectId, Schema } from 'mongoose'
import { ITask } from './Task'
import { normalizeRoles } from '@utils/roles'

export interface IUser {
  _id?: ObjectId | string
  name: string
  email: string
  image?: string
  roles?: string[]
  adminDomains?: ObjectId[] | string[]
  adminCompanies?: ObjectId[] | string[]
  tasks?: [ITask]
  payments?: [IPayment]
  services?: [IService]
  customers?: [ICustomer]
  rating?: number
  feedback?: [IFeedback]
  isWorker: boolean
  tel?: string
  address?: IAddress
  password?: string
}
export interface IFeedback {
  id: string
  grade: number
  text: string
}

export interface IPermissions {
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
  isUser: boolean
  isAdmin: boolean
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64c2ab3d4f2e4c7b1f8a1234"
 *         grade:
 *           type: integer
 *           format: int32
 *           example: 5
 *         text:
 *           type: string
 *           example: "Great work!"
 *
 *     Address:
 *       type: object
 *       description: Address object structure (customize as needed)
 *
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64c2ab3d4f2e4c7b1f8a5678"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         image:
 *           type: string
 *           format: uri
 *           example: "https://avatars.githubusercontent.com/u/583231?v=4"
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *           example: ["User"]
 *         tasks:
 *           type: array
 *           items:
 *             type: string
 *             description: ObjectId string referencing Task
 *           example: ["64c2ab3d4f2e4c7b1f8a9999"]
 *         payments:
 *           type: array
 *           items:
 *             type: string
 *             description: ObjectId string referencing Payment
 *         services:
 *           type: array
 *           items:
 *             type: string
 *             description: ObjectId string referencing Service
 *         customers:
 *           type: array
 *           items:
 *             type: string
 *             description: ObjectId string referencing Customer
 *         rating:
 *           type: number
 *           example: 4.5
 *         feedback:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Feedback'
 *         isWorker:
 *           type: boolean
 *           example: false
 *         tel:
 *           type: string
 *           example: "+1234567890"
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         password:
 *           type: string
 *           description: Hashed password (not returned by API)
 *           example: "hashed_password_string"
 */
const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: {
    type: String,
    default: 'https://avatars.githubusercontent.com/u/583231?v=4',
  },
  roles: { type: [String], default: ['User'] },
  adminDomains: [{ type: Schema.Types.ObjectId, ref: 'Domain' }],
  adminCompanies: [{ type: Schema.Types.ObjectId, ref: 'RealEstate' }],
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  customers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
  rating: { type: Number, default: 0 },
  feedback: [{ type: Object }],
  isWorker: { type: Boolean, default: false },
  tel: { type: String },
  address: { type: Object },
  password: { type: String },
})
UserSchema.pre('validate', function (next) {
  this.roles = normalizeRoles(this.roles)
  next()
})

UserSchema.pre(
  ['findOneAndUpdate', 'updateOne', 'updateMany'],
  function (next) {
    const update: any = this.getUpdate() || {}

    const incoming = update?.roles ?? update?.$set?.roles ?? update?.$set?.role

    if (incoming !== undefined) {
      const normalized = normalizeRoles(incoming)

      if (update.roles !== undefined) update.roles = normalized
      if (update.$set?.roles !== undefined) update.$set.roles = normalized
      if (update.$set?.role !== undefined) {
        update.$set.roles = normalized
        delete update.$set.role
      }

      this.setUpdate(update)
    }

    next()
  }
)

const User =
  (mongoose?.models?.User as mongoose.Model<IUser>) ||
  mongoose?.model('User', UserSchema)

export default User
