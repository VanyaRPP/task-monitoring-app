import { ObjectId } from 'mongoose'

export interface IFavor {
  orenda: string
  date?: Date
  electricPrice: number
  waterPrice: number
  inflaPrice: number
  description: string
}

export interface IExtendedFavor extends IFavor {
  _id: string
  _v: number
}

export interface IAddFavorResponse {
  success: boolean
  data: IExtendedFavor
}

export interface IGetFavorResponse {
  success: boolean
  data: IExtendedFavor[]
}

export interface IDeleteFavorResponse {
  data: string
  success: boolean
}
