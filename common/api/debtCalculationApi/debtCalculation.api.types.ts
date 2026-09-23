import { IDebtCalculationModel } from '@modules/models/DebtCalculation'
import { IDebtCalculationSnapshot } from '@utils/debt-calculation/serialize'

export type { IDebtCalculationModel }

export interface ISavedDebtCalculation extends IDebtCalculationModel {
  _id: string
  updatedAt?: Date
}

export interface IDebtCalculationKey {
  domainId: string
  companyId: string
}

/** Autosave sends the whole snapshot; the server upserts by domain and company. */
export type ISaveDebtCalculationRequest = IDebtCalculationSnapshot

export interface IDebtCalculationResponse {
  success: boolean
  data: ISavedDebtCalculation | null
}
