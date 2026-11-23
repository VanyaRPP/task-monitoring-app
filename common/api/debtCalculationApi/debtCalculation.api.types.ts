import { IDebtCalculationModel } from '@modules/models/DebtCalculation'
import type { IBuildingTariffs } from '@utils/debt-calculation/building-tariffs'
import type { ITariffPdfRead } from '@utils/debt-calculation/tariff-pdf'
import { IDebtImportRow } from '@utils/debt-calculation/import'
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

/** Months read off statement photos, merged into the company's calculation. */
export interface IImportDebtCalculationRequest extends IDebtCalculationKey {
  rows: IDebtImportRow[]
  openingDebt?: number
}

/** One address's tariffs, replacing what it had; no periods removes them. */
export interface ISaveBuildingTariffsRequest {
  domainId: string
  tariffs: IBuildingTariffs
}

export interface IReadTariffsPdfRequest {
  domainId: string
  /** `data:application/pdf;base64,…` */
  file: string
}

export interface IReadTariffsPdfResult extends ITariffPdfRead {
  /** The provider's address the document names, when it is one of them. */
  street?: string
}
