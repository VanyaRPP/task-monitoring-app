import { ObjectId } from 'mongoose'

export interface IService {
  orenda: number
  date?: Date
  electricPrice: number
  waterPrice: number
  inflaPrice: number
  description: string
}

export interface IExtendedService extends IService {
  _id: string
  _v: number
}

export interface IAddServiceResponse {
  success: boolean
  data: IExtendedService
}

export interface IGetServiceResponse {
  success: boolean
  data: IExtendedService[]
}

export interface IDeleteServiceResponse {
  data: string
  success: boolean
}
