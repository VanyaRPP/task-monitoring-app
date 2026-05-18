import { ObjectId } from 'mongoose'

export interface ICustomService {
  _id: string
  groupName?: string
  name: string
  services?: string
}

export interface ICustomDomainService {
  groupName: string
  services: {
    _id: ObjectId | string
    name: string
    fieldName: string
    __v?: number
  }[]
}

export interface IGetCustomServicesRequest {
  _id?: string[]
  domainId?: string
}

export interface IGetCustomServicesByDomainRequest {
  domainId?: string[]
}

export interface IGetCustomServicesResponse {
  data: ICustomService[]
}

export interface IGetCustomDomainServicesResponse {
  data: ICustomDomainService[]
}

export interface ICreateCustomServiceRequest {
  domainId: string
  name: string
}

export interface ICreateCustomServiceResponse {
  data: ICustomService
}

export interface IDeleteCustomServiceRequest {
  id: string
  domainId?: string
}

export interface IEditCustomServiceRequest {
  _id: string
  domainId?: string
  name?: string
  serviceType?: string | null
}

export interface IDeleteCustomServiceResponse {
  data: string
  success: boolean
}

export interface IExtendedCustomService extends ICustomService {
  _id: string
  __v: number
}
