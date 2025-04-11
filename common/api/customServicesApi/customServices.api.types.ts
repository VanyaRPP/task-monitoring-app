export interface ICustomService {
  _id: string
  name: string
  domain: string
  fieldName: string
}

export interface IGetCustomServicesRequest {
  _id?: string | string[]
  domainId?: string[] | string
}

export interface IGetCustomServicesResponse {
  data: ICustomService[]
}

export interface ICreateCustomServiceRequest {
  name: string
  domain: string
}

export interface ICreateCustomServiceResponse {
  data: ICustomService
}
export interface IGetCustomServicesByDomainRequest {
  domainId: string
}

