export interface IFilter {
  text: string
  value: string
}

export interface IPaymentFilterResponse {
  domainsFilter: IFilter[]
  realEstatesFilter: IFilter[]
  addressFilter: IFilter[]
  yearFilter: IFilter[]
  monthFilter: IFilter[]
  success: boolean
  total: number
}
