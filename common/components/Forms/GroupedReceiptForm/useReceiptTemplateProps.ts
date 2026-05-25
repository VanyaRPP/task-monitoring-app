import { Currency } from '@utils/constants'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import dayjs from 'dayjs'

interface ReceiptTemplatePropsInput {
  data: any
  contextCompany?: any
}

export interface ReceiptTemplateProps {
  data: any
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

export interface TemplateOverrides {
  [key: string]: unknown
}

const bankDetailsTriggerRegex =
  /(account details|usd account details|iban|swift|bic|bank name|bank address|bank name and address|рахунок|банк|мфо)/i

const bankAddressLabelRegex =
  /^(bank name and address|bank name|bank address|назва банку|адреса банку)\s*:/i

const entrepreneurTitleRegex =
  /^(private entrepreneur|private enterprise|fop|фоп|фізична особа\s*-?\s*підприємець)$/i

export function useReceiptTemplateProps({
  data,
  contextCompany,
}: ReceiptTemplatePropsInput): ReceiptTemplateProps {
  const currency =
    data?.currency ||
    data?.company?.currency ||
    contextCompany?.currency ||
    data?.domain?.currency

  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== Currency.UAH

  const invoiceDatePrefix = dayjs(data?.invoiceCreationDate).isValid()
    ? dayjs(data?.invoiceCreationDate).format('DDMMYY')
    : ''
  const modernInvoiceNumber = `${invoiceDatePrefix}${data?.invoiceNumber || ''}`

  const domainName =
    data?.domain?.name ||
    (typeof contextCompany?.domain === 'object'
      ? contextCompany?.domain?.name
      : '')

  const rows = (data?.invoice || []).filter(
    (item: any) => Number(item?.sum) !== 0
  )

  const getQty = (item: any): number => {
    if (Number.isFinite(Number(item?.amount))) {
      if (Number.isFinite(Number(item?.lastAmount))) {
        return Number(item.amount) - Number(item.lastAmount)
      }
      return Number(item.amount)
    }
    return 1
  }

  const subtotal = rows.reduce(
    (acc: number, item: any) => acc + Number(item?.sum || 0),
    0
  )
  const taxPercent = 0
  const taxAmount = 0
  const total = subtotal + taxAmount

  const domainDescription =
    data?.domain?.description ||
    (typeof contextCompany?.domain === 'object'
      ? contextCompany?.domain?.description
      : '')

  const issuedToLines = [
    ...(domainDescription?.trim()?.split('\n') || []),
  ].filter(Boolean)

  const receiverDescriptionLines = (
    data?.reciever?.description?.split('\n') || []
  )
    .map((line: string) => line?.trim())
    .filter(Boolean)

  const paymentInfoDescriptionLines: string[] = []
  const bankDetailsLines: string[] = []
  let isBankSection = false

  receiverDescriptionLines.forEach((line: string) => {
    if (bankDetailsTriggerRegex.test(line)) {
      isBankSection = true
    }

    if (isBankSection) {
      bankDetailsLines.push(line)
    } else {
      paymentInfoDescriptionLines.push(line)
    }
  })

  const normalizedBankDetailsLines = bankDetailsLines.reduce(
    (acc: string[], line: string) => {
      const normalizedLine = line?.trim()
      if (!normalizedLine) {
        return acc
      }

      const lastLine = acc[acc.length - 1] || ''
      const shouldAppendToPrevious =
        !!lastLine &&
        bankAddressLabelRegex.test(lastLine) &&
        !normalizedLine.includes(':')

      if (shouldAppendToPrevious) {
        acc[acc.length - 1] = `${lastLine} ${normalizedLine}`.trim()
      } else {
        acc.push(normalizedLine)
      }

      return acc
    },
    []
  )

  const normalizedCompanyName = (data?.reciever?.companyName || '').trim()
  const firstPaymentInfoLine = (paymentInfoDescriptionLines?.[0] || '').trim()
  const hasEntrepreneurTitle = entrepreneurTitleRegex.test(firstPaymentInfoLine)

  const companyDisplayName = hasEntrepreneurTitle
    ? `${firstPaymentInfoLine} ${normalizedCompanyName}`.trim()
    : normalizedCompanyName

  const paymentInfoBodyLines = hasEntrepreneurTitle
    ? paymentInfoDescriptionLines.slice(1)
    : paymentInfoDescriptionLines

  const shouldPrependDescriptionTitleLine =
    hasEntrepreneurTitle || !normalizedCompanyName

  const paymentInfoLines = [
    ...(shouldPrependDescriptionTitleLine && companyDisplayName
      ? [companyDisplayName]
      : []),
    ...paymentInfoBodyLines,
    ...(data?.reciever?.adminEmails || []),
  ].filter(Boolean)

  const companyLabel =
    (data?.company as { companyName?: string } | undefined)?.companyName ??
    contextCompany?.companyName ??
    ''

  return {
    data,
    isEnglish,
    currencyLabel,
    currency,
    modernInvoiceNumber,
    domainName,
    companyLabel,
    rows,
    getQty,
    subtotal,
    taxPercent,
    taxAmount,
    total,
    paymentInfoLines,
    issuedToLines,
    normalizedBankDetailsLines,
    overrides: undefined,
  }
}
