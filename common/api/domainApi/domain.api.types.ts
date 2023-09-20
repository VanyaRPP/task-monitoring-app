export interface IDomainModel {
  name: string
  adminEmails: [string]
  streets: string[]
  description: string
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
  total: number
}

export interface IDeleteDomainResponse {
  data: string
  success: boolean
}
