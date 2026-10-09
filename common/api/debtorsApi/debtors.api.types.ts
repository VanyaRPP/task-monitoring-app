import type { IDebtorInflation } from '@utils/debt-calculation/debtors-inflation'

export type { IDebtorInflation }

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
    inflation?: IDebtorInflation | null
  }[]
  message?: string
  succes: boolean
}

export interface IGetDebtorsRequest {
  domainIds: any
}
