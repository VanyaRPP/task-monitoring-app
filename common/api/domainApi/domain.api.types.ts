export interface IDomainModel {
  name: string
  adminEmails: [string]
  streets: string[]
  description: string
  mfo: string
  iban: string
  rnokpp: string
  IEName: string
  domainBankToken: IDomainBankToken[]
  customServices: ICustomService[]
  domainTypeTemplateId?: string
  defaultTemplate?: string
}

export type DomainTypeTemplateCategory =
  | 'utility'
  | 'it'
  | 'edu'
  | 'auto'
  | 'real-estate'
  | 'other'

export interface IDomainTypeTemplateGroup {
  groupName: string
  serviceIds: string[]
}

export interface IDomainTypeTemplate {
  _id: string
  name: string
  category: DomainTypeTemplateCategory
  isBuiltIn: boolean
  groups: IDomainTypeTemplateGroup[]
  createdBy?: string
  archivedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface IDomainTypeTemplateWithUsage extends IDomainTypeTemplate {
  usageCount: number
}

export interface ICustomService {
  groupName: string
  services: string[]
}
export interface IDomainService {
  name: string
  price: number
}

export interface IDomainBankToken {
  acc?: string
  token: string
  shortToken: string
  tokenName: string
  confidant: string[]
  name: string
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

export interface IGetDomainByPkResponse {
  success: boolean
  data: IExtendedDomain
}

export interface IDeleteDomainResponse {
  data: string
  success: boolean
}
export interface IExtendedAreas {
  _id: string
  companies: companyAreas[]
  totalArea: number
}
export interface companyAreas {
  totalArea: number
  companyName: string
  rentPart: number
}

export interface IGetAreasResponse {
  success: boolean
  data: IExtendedAreas
}
