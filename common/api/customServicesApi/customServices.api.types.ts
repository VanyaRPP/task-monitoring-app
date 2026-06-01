import { ObjectId } from 'mongoose'
import { DomainTypeTemplateCategory } from '@modules/models/domain-type-template'

export interface ICustomService {
  _id: string
  groupName?: string
  name: string
  services?: string
}

export interface ICustomDomainService {
  // `null` marks the synthetic "ungrouped" bucket — services in the domain
  // catalog that aren't assigned to any user-defined group. Renderers should
  // treat these as standalone (no group header in invoices).
  groupName: string | null
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
  templateCategory?: DomainTypeTemplateCategory
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
