import { IUser } from '@modules/models/User'
import { ObjectId } from 'mongoose'

export interface ICustomer {
  customer: IExtendedCustomer | ObjectId | IUser['_id'] | string
  location: string
  information: string
  description: string
}

export interface IExtendedCustomer extends ICustomer {
  _id: string
  _v: number
}

export interface IAddCustomerResponse {
  success: boolean
  data: IExtendedCustomer
}

export interface IGetCustomerResponse {
  success: boolean
  data: IExtendedCustomer[]
}

export interface IDeleteCustomerResponse {
  data: string
  success: boolean
}
