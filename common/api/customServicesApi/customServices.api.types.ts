export interface ICustomService {
  _id: string
  name: string
  fieldName: string
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

export interface ICreateCustomServiceRequest {
  name: string
}

export interface ICreateCustomServiceResponse {
  data: ICustomService
}
