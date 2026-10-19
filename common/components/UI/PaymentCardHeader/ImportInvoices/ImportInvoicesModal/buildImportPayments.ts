import {
  BuildPaymentFormData,
  buildPaymentPayload,
} from '@components/AddPaymentModal/buildPaymentPayload'
import { buildMonthServicePlaceholder } from '@components/Forms/AddPaymentForm/month-service-placeholder'
import { IProvider, IReciever } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed } from '@utils/helpers'
import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const IMPORT_DATE_FORMAT = 'DD.MM.YYYY'

const EMPTY_TRANSACTION = {
  AUT_CNTR_ACC: '',
  AUT_CNTR_NAM: '',
  AUT_CNTR_MFO: '',
  Description: '',
  TECHNICAL_TRANSACTION_ID: '',
}

export interface ImportedInvoiceRow {
  monthService: string
  generalSum: number | string
}

export interface BuildImportPaymentsParams {
  rows: ImportedInvoiceRow[]
  formData: Pick<
    BuildPaymentFormData,
    'operation' | 'domain' | 'street' | 'company' | 'currency'
  >
  provider: IProvider
  reciever: IReciever
}

export type ImportInput =
  | { kind: 'rows'; rows: ImportedInvoiceRow[] }
  | { kind: 'text'; text: string }
  | { kind: 'invalid'; reason: string }

export const parseImportInput = (input: string): ImportInput => {
  const value = (input ?? '').trim()
  if (!/^[[{]/.test(value)) return { kind: 'text', text: value }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? { kind: 'rows', rows: parsed }
      : { kind: 'invalid', reason: 'JSON має бути масивом: [ {...}, {...} ]' }
  } catch {
    return {
      kind: 'invalid',
      reason: 'JSON містить помилку - перевірте лапки й коми',
    }
  }
}

const parseImportDate = (value: string, index: number): Dayjs => {
  const date = dayjs(value, IMPORT_DATE_FORMAT, true)
  if (!date.isValid()) {
    throw new Error(
      `Рядок ${index + 1}: дата «${value}» має бути у форматі ДД.ММ.РРРР`
    )
  }
  return date
}

const parseImportSum = (value: number | string, index: number): number => {
  const sum = Number(String(value ?? '').replace(',', '.'))
  if (value === '' || value == null || isNaN(sum)) {
    throw new Error(`Рядок ${index + 1}: generalSum має бути числом`)
  }
  return +toRoundFixed(sum)
}

export const buildImportPayments = ({
  rows,
  formData,
  provider,
  reciever,
}: BuildImportPaymentsParams) =>
  rows.map((row, index) =>
    buildPaymentPayload({
      formData: {
        ...formData,
        invoiceCreationDate: parseImportDate(row.monthService, index),
        generalSum: parseImportSum(row.generalSum, index),
      },
      monthServiceId: undefined,
      provider,
      reciever,
      transaction: EMPTY_TRANSACTION,
      template: 'classic',
      invoiceLang: 'uk',
    })
  )

type ImportPayment = ReturnType<typeof buildPaymentPayload>

export const attachMonthServices = async (
  payments: ImportPayment[],
  resolveMonthServiceId: (placeholder: string) => Promise<string>
): Promise<ImportPayment[]> => {
  const placeholders = payments.map(({ invoiceCreationDate }) =>
    buildMonthServicePlaceholder(dayjs(invoiceCreationDate))
  )

  const idByPlaceholder = new Map<string, string>()
  for (const placeholder of placeholders) {
    if (!idByPlaceholder.has(placeholder)) {
      idByPlaceholder.set(placeholder, await resolveMonthServiceId(placeholder))
    }
  }

  return payments.map((payment, index) => ({
    ...payment,
    monthService: idByPlaceholder.get(placeholders[index]),
  }))
}
