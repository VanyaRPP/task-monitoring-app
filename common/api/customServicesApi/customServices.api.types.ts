import { ObjectId } from "mongoose"

export interface ICustomService {
  _id: string
  groupName?: string
  name: string
  services?: string
}

export interface ICustomDomainService {
  groupName: string
  services: {
    _id: ObjectId
    name: string
    fieldName: string
    __v: number
  }
}

export interface IGetCustomServicesRequest {
  _id?: string[]
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
  name: string
}

export interface ICreateCustomServiceResponse {
  data: ICustomService
}
