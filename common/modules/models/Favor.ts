import { IUser } from './User'
//import { favorSchemeMiddleware } from '@common/lib/favorSchemeMiddleware'
import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IFavorModel {
  orenda: number
  date: Date
  electricPrice: number
  waterPrice: number
  inflaPrice: number
  description: string
}

export const FavorSchema = new Schema<IFavorModel>({
  orenda: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now() },
  electricPrice: { type: Number, required: true },
  waterPrice: { type: Number, required: true },
  inflaPrice: { type: Number, required: true },
  description: { type: String, required: true },
})

//favorSchemeMiddleware()

const Favor = mongoose.models.Favor || mongoose.model('Favor', FavorSchema)

export default Favor
