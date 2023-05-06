import { ObjectId } from 'mongoose'

export interface IService {
  rentPrice: number
  date: Date
  address: string
  electricityPrice: number
  waterPrice: number
  inflicionPrice: number
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
