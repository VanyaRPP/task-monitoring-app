import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { CURRENCY_MAP } from '@utils/constants'
import dayjs from 'dayjs'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined, EditOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import s from './style.module.scss'

const normalizeCurrency = (currency?: string): 'UAH' | 'USD' | 'EUR' => {
  const value = currency?.toUpperCase()
  if (value === 'USD' || value === 'EUR') return value
  return 'UAH'
}

const getCurrencyShortLabel = (currency?: string): string => {
  const normalized = normalizeCurrency(currency)
  const label = CURRENCY_MAP[normalized]?.label

  if (normalized === 'USD') return 'USD'
  if (normalized === 'EUR') return 'EUR'

  return label || 'грн'
}

interface Props {
  currPayment?: IExtendedPayment | null
  paymentData?: IExtendedPayment | null | undefined
  paymentActions: { preview: boolean; edit: boolean }
}

const GroupedReceiptForm: FC<Props> = ({
  currPayment,
  paymentData,
  paymentActions,
}) => {
  const { company } = usePaymentContext()
  const rawData = currPayment ?? paymentData ?? null
  const data = rawData as any
  const currency =
    data?.company?.currency || company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const domainName =
    data?.domain?.name ||
    (typeof company?.domain === 'object' ? company?.domain?.name : '')
  const rows = (data?.invoice || []).filter((item: any) => Number(item?.sum) !== 0)

  const getQty = (item: any) => {
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
    (typeof company?.domain === 'object' ? company?.domain?.description : '')

  const issuedToLines = [...(domainDescription?.trim()?.split('\n') || [])].filter(
    Boolean
  )

  const paymentInfoLines = [
    data?.reciever?.companyName,
    ...(data?.reciever?.adminEmails || []),
    ...(data?.provider?.description?.trim()?.split('\n') || []),
  ].filter(Boolean)

  const componentRef = useRef<HTMLDivElement | null>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      (data?.company?.companyName ?? data?.reciever?.companyName ?? '') +
        '-inv-' +
        (data?.invoiceNumber ?? '') || 'invoice',
  })
  if (!rawData) {
    return null
  }

  return (
    <>
      <PrinterOutlined className={s.print} onClick={handlePrint} />

      <Tooltip title="Режим редагування">
        <EditOutlined className={s.edit} />
      </Tooltip>
      <div
        className={s.invoiceContainer}
        ref={componentRef}
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '2em auto 1em',
        }}
      >
        <div className={s.invoiceHeader}>
          <div className={s.brandBlock}>
            <div className={s.brandLogo}>
              <img src="/icons/icon-96x96.png" alt="SpaceHub" />
            </div>
            <div className={s.brandText}>
              <div>{domainName || ''}</div>
            </div>
          </div>
          <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'} <small>№{data?.invoiceNumber}</small></h1>
        </div>

        <div className={s.invoiceInfoCard}>
          <div className={s.infoColumn}>
            <div className={s.paymentInfo}>
              <h4>{isEnglish ? 'PAYMENT INFO:' : 'ПЛАТІЖНІ ДАНІ:'}</h4>
              {paymentInfoLines.map((line: string, idx: number) => (
                <div key={`${line}-${idx}`}>{line}</div>
              ))}
            </div>
          </div>

          <div className={s.infoColumn}>
            <h4>{isEnglish ? 'ISSUED TO:' : 'ОТРИМУВАЧ:'}</h4>
            {issuedToLines.map((line: string, idx: number) => (
              <div key={`${line}-${idx}`}>{line}</div>
            ))}
          </div>
        </div>

        <table className={s.invoiceTable}>
          <thead>
            <tr>
              <th>{isEnglish ? 'DESCRIPTION' : 'ОПИС'}</th>
              <th>{isEnglish ? 'RATE' : 'ЦІНА'}</th>
              <th>{isEnglish ? 'QTY' : 'К-СТЬ'}</th>
              <th>{isEnglish ? 'TOTAL' : 'СУМА'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item: any, index: number) => {
              const qty = getQty(item)
              const rate = Number.isFinite(Number(item?.price))
                ? Number(item.price)
                : qty
                ? Number(item?.sum || 0) / qty
                : Number(item?.sum || 0)

              return (
                <tr key={`${item?.type || item?.name}-${index}`}>
                  <td>{item?.name || item?.type || '-'}</td>
                  <td>{rate.toFixed(2)}</td>
                  <td>{qty}</td>
                  <td>
                    {Number(item?.sum || 0).toFixed(2)} {currencyLabel}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className={s.summarySection}>
          <div className={s.invoiceDates}>
            <div className={s.infoRow}>
              <span>{isEnglish ? 'DATE:' : 'ДАТА:'}</span>
              <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
            </div>
            <div className={s.infoRow}>
              <span>{isEnglish ? 'DUE DATE:' : 'СТРОК ОПЛАТИ:'}</span>
              <strong>{dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}</strong>
            </div>
          </div>

          <div className={s.totalsBlock}>
            <div className={`${s.totalRow} ${s.grandTotal}`}>
              <span>{isEnglish ? 'TOTAL' : 'ВСЬОГО'}</span>
              <strong>
                {total.toFixed(2)} {currencyLabel}
              </strong>
            </div>
          </div>
        </div>

        <div className={s.footerNote}>
          <strong>{isEnglish ? 'THANK YOU' : 'ДЯКУЄМО'}</strong>
          <div className={s.signatureLine}>______________</div>
        </div>
      </div>
    </>
  )
}

export default GroupedReceiptForm
