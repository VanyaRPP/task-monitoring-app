import { RefObject } from 'react'

export interface TemplateProps {
  data: any
  componentRef: RefObject<HTMLDivElement | null>
  isEnglish: boolean
  currencyLabel: string
  currency?: string
  modernInvoiceNumber: string
  rows: any[]
  getQty: (item: any) => number
  subtotal: number
  taxPercent: number
  taxAmount: number
  total: number
  paymentInfoLines: string[]
  issuedToLines: string[]
  normalizedBankDetailsLines: string[]
}
