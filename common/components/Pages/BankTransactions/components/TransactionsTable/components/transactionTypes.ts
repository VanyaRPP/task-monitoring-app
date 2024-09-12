export interface ITransaction {
  AUT_MY_CRF: string
  AUT_MY_MFO: string
  AUT_MY_ACC: string
  AUT_MY_NAM: string
  AUT_MY_MFO_NAME: string
  AUT_MY_MFO_CITY: string
  AUT_CNTR_CRF: string
  AUT_CNTR_MFO: string
  AUT_CNTR_ACC: string
  AUT_CNTR_NAM: string
  AUT_CNTR_MFO_NAME: string
  AUT_CNTR_MFO_CITY: string
  CCY: string
  FL_REAL: string
  PR_PR: string
  DOC_TYP: string
  NUM_DOC: string
  DAT_KL: string
  DAT_OD: string
  OSND: string
  SUM: string
  SUM_E: string
  REF: string
  REFN: string
  TIM_P: string
  DATE_TIME_DAT_OD_TIM_P: string
  ID: string
  TRANTYPE: string
  DLR: string
  TECHNICAL_TRANSACTION_ID: string
}

export interface ITransactionData {
  exist_next_page: boolean
  next_page_id: string
  status: string
  transactions: ITransaction[]
}

export interface IBankRes<T> {
  data: T
}
