import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
} from '../invoice-party-headings'
import az from './azure.module.scss'

const AzureTemplate: FC<TemplateProps> = ({
  data,
  componentRef,
  isEnglish,
  currencyLabel,
  modernInvoiceNumber,
  domainName,
  rows,
  getQty,
  subtotal,
  taxPercent,
  taxAmount,
  total,
  paymentInfoLines,
  issuedToLines,
  normalizedBankDetailsLines,
}) => {
  const { heading: paymentHeading, bodyLines: paymentBodyLines } =
    getBillFromHeadingAndBodyLines(data, paymentInfoLines)
  const { heading: issuedHeading, bodyLines: issuedBodyLines } =
    getIssuedToHeadingAndBodyLines(data, issuedToLines, domainName)

  return (
    <div
      className={az.azInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      <div className={az.azHeader}>
        <div className={az.azBrand}>
          <div className={az.azBrandIcon}>OD</div>
          <div className={az.azBrandText}>
            <div className={az.azBrandName}>
              {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
            </div>
            <div className={az.azBrandSub}>Digital Services</div>
          </div>
        </div>
        <div className={az.azInvoiceHead}>
          <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
          <span className={az.azInvoiceNum}>
            №&thinsp;{modernInvoiceNumber}
          </span>
        </div>
      </div>

      <div className={az.azMeta}>
        <div className={az.azMetaItem}>
          <span className={az.azMetaLabel}>{isEnglish ? 'Date' : 'Дата'}</span>
          <span className={az.azMetaValue}>
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
          </span>
        </div>
        <div className={az.azMetaItem}>
          <span className={az.azMetaLabel}>
            {isEnglish ? 'Due date' : 'Строк оплати'}
          </span>
          <span className={az.azMetaValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
          </span>
        </div>
        <div className={az.azMetaItem}>
          <span className={az.azMetaLabel}>
            {isEnglish ? 'Invoice №' : 'Рахунок №'}
          </span>
          <span className={az.azMetaValue}>{modernInvoiceNumber}</span>
        </div>
        <div className={az.azMetaItem}>
          <span className={az.azMetaLabel}>
            {isEnglish ? 'Currency' : 'Валюта'}
          </span>
          <span className={az.azMetaValue}>{currencyLabel}</span>
        </div>
      </div>

      <div className={az.azParties}>
        <div className={az.azPartyCard}>
          <div className={az.azPartyLabel}>
            {isEnglish ? 'Bill from' : 'Платіжні дані'}
          </div>
          {!!paymentHeading && (
            <div className={az.azPartyName}>{paymentHeading}</div>
          )}
          {paymentBodyLines.map((line: string, idx: number) => (
            <div
              key={`pi-${idx}`}
              className={
                !paymentHeading && idx === 0 ? az.azPartyName : az.azPartyLine
              }
            >
              {line}
            </div>
          ))}
          {!!normalizedBankDetailsLines.length && (
            <div className={az.azBankCard}>
              {normalizedBankDetailsLines.map((line: string, idx: number) => {
                const sep = line.indexOf(':')
                if (sep < 0) {
                  return (
                    <div className={az.azBankLine} key={`bk-${idx}`}>
                      {line}
                    </div>
                  )
                }
                return (
                  <div className={az.azBankLine} key={`bk-${idx}`}>
                    <span className={az.azBankLineLabel}>
                      {line.slice(0, sep + 1)}
                    </span>
                    {line.slice(sep + 1)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className={az.azPartyCard}>
          <div className={az.azPartyLabel}>
            {isEnglish ? 'Issued to' : 'Отримувач'}
          </div>
          {!!issuedHeading && (
            <div className={az.azPartyName}>{issuedHeading}</div>
          )}
          {issuedBodyLines.map((line: string, idx: number) => (
            <div
              key={`it-${idx}`}
              className={
                !issuedHeading && idx === 0 ? az.azPartyName : az.azPartyLine
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className={az.azTableWrap}>
        <table className={az.azTable}>
          <thead>
            <tr>
              <th>{isEnglish ? 'Description' : 'Опис'}</th>
              <th>{isEnglish ? 'Rate' : 'Ціна'}</th>
              <th>{isEnglish ? 'Qty' : 'К-сть'}</th>
              <th>{isEnglish ? 'Total' : 'Сума'}</th>
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
                  <td>{item?.name || item?.type || '—'}</td>
                  <td>{rate.toFixed(2)}</td>
                  <td>{qty}</td>
                  <td>
                    {Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className={az.azSummary}>
        <div className={az.azDates}>
          <div className={az.azDateRow}>
            <span>{isEnglish ? 'Issued' : 'Дата'}</span>
            <strong>
              {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
            </strong>
          </div>
          <div className={az.azDateRow}>
            <span>{isEnglish ? 'Due' : 'Строк'}</span>
            <strong>
              {dayjs(data?.invoiceCreationDate)
                .add(5, 'd')
                .format('DD.MM.YYYY')}
            </strong>
          </div>
        </div>
        <div className={az.azTotalsCard}>
          {taxPercent > 0 && (
            <>
              <div className={az.azTotalRow}>
                <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                <strong>
                  {subtotal.toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
              <div className={az.azTotalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>
                  {taxAmount.toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </>
          )}
          <div className={`${az.azTotalRow} ${az.azGrandTotal}`}>
            <span>{isEnglish ? 'TOTAL DUE' : 'ДО СПЛАТИ'}</span>
            <strong>
              {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;
              {currencyLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className={az.azFooter}>
        <div className={az.azFooterLeft}>
          <div className={az.azFooterNote}>
            {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
          </div>
          <div className={az.azFooterBadge}>
            {isEnglish ? 'AWAITING PAYMENT' : 'ОЧІКУЄ ОПЛАТИ'}
          </div>
        </div>
        <div className={az.azSignatureBlock}>
          <div className={az.azSignatureLine}>______________</div>
          <div className={az.azSignatureCaption}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AzureTemplate
