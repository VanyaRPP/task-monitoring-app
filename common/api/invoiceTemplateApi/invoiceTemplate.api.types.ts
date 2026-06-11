export interface IInvoiceTemplate {
  _id: string
  name: string
  baseTemplateKey: string
  providerDescription: string
  receiverDescription: string
  domainId?: string
  isBuiltIn: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface IGetInvoiceTemplatesRequest {
  domainId: string
}

export interface IGetInvoiceTemplatesResponse {
  success: boolean
  data: IInvoiceTemplate[]
}

export interface ICreateInvoiceTemplateRequest {
  name: string
  baseTemplateKey: string
  providerDescription: string
  receiverDescription: string
  domainId: string
}

export interface ICreateInvoiceTemplateResponse {
  success: boolean
  data: IInvoiceTemplate
}

export interface IUpdateInvoiceTemplateRequest {
  _id: string
  name?: string
  providerDescription?: string
  receiverDescription?: string
  baseTemplateKey?: string
}

export interface IUpdateInvoiceTemplateResponse {
  success: boolean
  data: IInvoiceTemplate
}

export interface IDeleteInvoiceTemplateResponse {
  success: boolean
  data: { _id: string }
}
