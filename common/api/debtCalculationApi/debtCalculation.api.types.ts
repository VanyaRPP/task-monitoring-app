import { IDebtCalculationModel } from '@modules/models/DebtCalculation'
import { IDebtCalculationSnapshot } from '@utils/debt-calculation/serialize'

export type { IDebtCalculationModel }

export interface ISavedDebtCalculation extends IDebtCalculationModel {
  _id: string
}

export interface ISaveDebtCalculationRequest extends IDebtCalculationSnapshot {
  /** Є — оновлюємо наявний; немає — створюємо новий. */
  _id?: string
  name: string
}

export interface IDebtCalculationResponse {
  success: boolean
  data: ISavedDebtCalculation
}

export interface IDebtCalculationListResponse {
  success: boolean
  data: ISavedDebtCalculation[]
}
