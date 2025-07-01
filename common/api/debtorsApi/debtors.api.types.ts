export interface IGetDebtorsResponse {
  companies?: {
    companyId: string
    companyName: string
    debtPerMonth: {
      monthService: string
      totalDue: number
      paid: number
      remaining: number
    }[]
    totalDebt: number
  }[]
  message?: string
  succes: boolean
}

export interface IGetDebtorsRequest {
  domainIds: any
}
