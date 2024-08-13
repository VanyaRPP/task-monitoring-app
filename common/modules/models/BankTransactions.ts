import mongoose, { Schema } from 'mongoose'

const TransactionSchema = new Schema({
  AUT_MY_CRF: { type: String, required: true }, // ЄДРПОУ одержувача
  AUT_MY_MFO: { type: String, required: true }, // МФО одержувача
  AUT_MY_ACC: { type: String, required: true }, // рахунок одержувача
  AUT_MY_NAM: { type: String, required: true }, // назва одержувача
  AUT_MY_MFO_NAME: { type: String, required: true }, // банк одержувача
  AUT_MY_MFO_CITY: { type: String, required: true }, // назва міста банку
  AUT_CNTR_CRF: { type: String, required: true }, // ЄДРПОУ контрагента
  AUT_CNTR_MFO: { type: String, required: true }, // МФО контрагента
  AUT_CNTR_ACC: { type: String, required: true }, // рахунок контрагента
  AUT_CNTR_NAM: { type: String, required: true }, // назва контрагента
  AUT_CNTR_MFO_NAME: { type: String, required: true }, // назва банку контрагента
  AUT_CNTR_MFO_CITY: { type: String, required: true }, // назва міста банку
  CCY: { type: String, required: true }, // валюта
  FL_REAL: { type: String, enum: ['r', 'i'], required: true }, // ознака реальності проведення
  PR_PR: { type: String, enum: ['p', 't', 'r', 'n'], required: true }, // стан транзакції
  DOC_TYP: { type: String, required: true }, // тип пл. документа
  NUM_DOC: { type: String, required: true }, // номер документа
  DAT_KL: { type: String, required: true }, // клієнтська дата
  DAT_OD: { type: String, required: true }, // дата валютування
  OSND: { type: String, required: true }, // підстава платежу
  SUM: { type: String, required: true }, // сума
  SUM_E: { type: String, required: true }, // сума в національній валюті
  REF: { type: String, required: true }, // референс проведення
  REFN: { type: String, required: true }, // № з/п всередині проведення
  TIM_P: { type: String, required: true }, // час проведення
  DATE_TIME_DAT_OD_TIM_P: { type: String, required: true }, // повний час проведення
  ID: { type: String, required: true }, // ID транзакції
  TRANTYPE: { type: String, enum: ['D', 'C'], required: true }, // тип транзакції (дебет/кредит)
  DLR: { type: String, required: true }, // референс платежу сервісу
  TECHNICAL_TRANSACTION_ID: { type: String, required: true }, // технічний ID транзакції
})

const TransactionsResponseSchema = new Schema({
  status: { type: String, enum: ['SUCCESS', 'FAILURE'], required: true }, // ознака успішності відповіді
  type: { type: String, enum: ['transactions'], required: true }, // тип відповіді
  exist_next_page: { type: Boolean, required: true }, // ознака наявності наступної пачки
  next_page_id: { type: String, required: true }, // ідентифікатор наступної пачки
  transactions: { type: [TransactionSchema], required: true }, // масив об’єктів із транзакціями
})

module.exports = mongoose.model(
  'TransactionsResponse',
  TransactionsResponseSchema
)
