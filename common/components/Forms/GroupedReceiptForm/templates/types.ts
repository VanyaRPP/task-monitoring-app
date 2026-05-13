import { RefObject } from 'react'
import type { TemplateOverrides } from '../useReceiptTemplateProps'

export interface TemplateProps {
  data: any
  componentRef: RefObject<HTMLDivElement | null>
  isEnglish: boolean
  currencyLabel: string
  currency?: string
  modernInvoiceNumber: string
  domainName?: string
  companyLabel?: string
  rows: any[]
  getQty: (item: any) => number
  subtotal: number
  taxPercent: number
  taxAmount: number
  total: number
  paymentInfoLines: string[]
  issuedToLines: string[]
  normalizedBankDetailsLines: string[]
  overrides?: TemplateOverrides
}
