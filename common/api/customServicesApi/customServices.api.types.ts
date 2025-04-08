export interface ICustomService {
  _id: string
  name: string
  domain: string
  fieldName: string
}

export interface IGetCustomServicesRequest {
  domainId?: string[] | string
}

export interface IGetCustomServicesResponse {
  data: ICustomService[]
}

export interface ICreateCustomServiceRequest {
  name: string
  domainId: string
}

export interface ICreateCustomServiceResponse {
  data: ICustomService
}
