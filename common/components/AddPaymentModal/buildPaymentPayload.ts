import { combineDayWithCurrentTime } from '@common/assets/features/formatDate'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Currency } from '@utils/constants'
import type { Dayjs } from 'dayjs'
import type { TemplateKey } from './resolveTemplate'

export interface BuildPaymentFormData {
  invoiceNumber?: number
  operation?: string
  domain?: string
  street?: string
  company?: string
  invoiceCreationDate?: Dayjs
  description?: string
  generalSum?: number
  debit?: number
  currency?: string
  invoice?: IPaymentField[]
}

export interface BuildPaymentPayloadParams {
  formData: BuildPaymentFormData
  monthServiceId: string
  provider: any
  reciever: any
  transaction: any
  template: TemplateKey
}

/**
 * Pure builder for the payload sent to addPayment / editPayment mutations.
 * No Form, no React, no side effects.
 */
export const buildPaymentPayload = ({
  formData,
  monthServiceId,
  provider,
  reciever,
  transaction,
  template,
}: BuildPaymentPayloadParams) => ({
  invoiceNumber: formData.invoiceNumber,
  type: formData.operation,
  domain: formData.domain,
  street: formData.street,
  company: formData.company,
  monthService: monthServiceId,
  invoiceCreationDate: combineDayWithCurrentTime(formData.invoiceCreationDate),
  description: formData.description || '',
  generalSum: formData.generalSum || formData.debit,
  currency: formData.currency || Currency.UAH,
  provider,
  reciever,
  transaction,
  invoice: formData.debit
    ? (formData.invoice ?? []).filter((invoice) => +invoice.sum !== 0)
    : [],
  template,
})
