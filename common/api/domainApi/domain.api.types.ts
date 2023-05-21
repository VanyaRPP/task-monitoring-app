export interface IDomainModel {
  name: string
  address: string
  adminEmails: [string]
  streets: string[]
  description: string
  bankInformation: string
  phone: string
  email: string
}

export interface IExtendedDomain extends IDomainModel {
  _id: string
  _v: number
}

export interface IAddDomainResponse {
  success: boolean
  data: IExtendedDomain
}

export interface IGetDomainResponse {
  success: boolean
  data: IExtendedDomain[]
}

export interface IDeleteDomainResponse {
  data: string
  success: boolean
}
