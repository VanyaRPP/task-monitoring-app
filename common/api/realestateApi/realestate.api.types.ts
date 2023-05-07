import { ObjectId } from 'mongoose'

export interface IRealestate {
  address: string
  description: string
  adminEmails: string[]
  pricePerMeter: number
  servicePricePerMeter: number
  totalArea: number
  garbageCollector: number
}

export interface IExtendedRealestate extends IRealestate {
  _id: string
  _v: number
}

export interface IAddRealestateResponse {
  success: boolean
  data: IExtendedRealestate
}

export interface IGetRealestateResponse {
  success: boolean
  data: IExtendedRealestate[]
}
