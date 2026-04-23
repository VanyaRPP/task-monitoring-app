import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import { Currency } from '@utils/constants'
import dayjs from 'dayjs'

export function preparePaymentData(data: any) {
  const currency = data?.currency || data?.company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== Currency.UAH

  const invoiceDatePrefix = dayjs(data?.invoiceCreationDate).isValid()
    ? dayjs(data?.invoiceCreationDate).format('DDMMYY')
    : ''
  const modernInvoiceNumber = `${invoiceDatePrefix}${data?.invoiceNumber || ''}`

  const domainName =
    data?.domain?.name ||
    (typeof data?.company?.domain === 'object' ? data?.company?.domain?.name : '')

  const rows = (data?.invoice || []).filter((item: any) => Number(item?.sum) !== 0)

  const getQty = (item: any): number => {
    if (Number.isFinite(Number(item?.amount))) {
      if (Number.isFinite(Number(item?.lastAmount))) return Number(item.amount) - Number(item.lastAmount)
      return Number(item.amount)
    }
    return 1
  }

  const subtotal = rows.reduce((acc: number, item: any) => acc + Number(item?.sum || 0), 0)
  const total = subtotal

  const domainDescription =
    data?.domain?.description ||
    (typeof data?.company?.domain === 'object' ? data?.company?.domain?.description : '')
  const issuedToLines = [...(domainDescription?.trim()?.split('\n') || [])].filter(Boolean)

  const receiverDescriptionLines = (data?.reciever?.description?.split('\n') || [])
    .map((line: string) => line?.trim())
    .filter(Boolean)

  const bankDetailsTriggerRegex =
    /(account details|usd account details|iban|swift|bic|bank name|bank address|bank name and address|рахунок|банк|мфо)/i

  const paymentInfoDescriptionLines: string[] = []
  const bankDetailsLines: string[] = []
  let isBankSection = false

  receiverDescriptionLines.forEach((line: string) => {
    if (bankDetailsTriggerRegex.test(line)) isBankSection = true
    if (isBankSection) bankDetailsLines.push(line)
    else paymentInfoDescriptionLines.push(line)
  })

  const bankAddressLabelRegex =
    /^(bank name and address|bank name|bank address|назва банку|адреса банку)\s*:/i

  const normalizedBankDetailsLines = bankDetailsLines.reduce((acc: string[], line: string) => {
    const nl = line?.trim()
    if (!nl) return acc
    const last = acc[acc.length - 1] || ''
    if (!!last && bankAddressLabelRegex.test(last) && !nl.includes(':')) {
      acc[acc.length - 1] = `${last} ${nl}`.trim()
    } else acc.push(nl)
    return acc
  }, [])

  const entrepreneurTitleRegex =
    /^(private entrepreneur|private enterprise|fop|фоп|фізична особа\s*-?\s*підприємець)$/i

  const normalizedCompanyName = (data?.reciever?.companyName || '').trim()
  const firstPaymentInfoLine = (paymentInfoDescriptionLines?.[0] || '').trim()
  const hasEntrepreneurTitle = entrepreneurTitleRegex.test(firstPaymentInfoLine)

  const companyDisplayName = hasEntrepreneurTitle
    ? `${firstPaymentInfoLine} ${normalizedCompanyName}`.trim()
    : normalizedCompanyName

  const paymentInfoBodyLines = hasEntrepreneurTitle
    ? paymentInfoDescriptionLines.slice(1)
    : paymentInfoDescriptionLines

  const paymentInfoLines = [
    companyDisplayName,
    ...paymentInfoBodyLines,
    ...(data?.reciever?.adminEmails || []),
  ].filter(Boolean)

  return {
    rows,
    getQty,
    subtotal,
    total,
    currency,
    isEnglish,
    currencyLabel,
    modernInvoiceNumber,
    domainName,
    paymentInfoLines,
    issuedToLines,
    normalizedBankDetailsLines,
  }
}
