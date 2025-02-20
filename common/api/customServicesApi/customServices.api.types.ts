export interface ICustomService {
  _id: string
  name: string
  description: string
  domainId: string
  fieldName?: string
}

export interface IGetCustomServicesRequest {
  domainIds: string[]
}

export interface IGetCustomServicesResponse {
  data: ICustomService[]
}

export interface ICreateCustomServiceRequest {
  name: string
  domainId: string
  description?: string
}

export interface ICreateCustomServiceResponse {
  data: ICustomService
}
