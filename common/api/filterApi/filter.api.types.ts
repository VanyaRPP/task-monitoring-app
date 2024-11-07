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
  streetsFilter: IFilter[]
  success: boolean
  total: number
}
