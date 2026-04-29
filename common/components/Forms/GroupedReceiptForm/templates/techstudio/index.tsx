import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
} from '../invoice-party-headings'
import ts from './techstudio.module.scss'

const TechstudioTemplate: FC<TemplateProps> = ({
  data, componentRef, isEnglish, currencyLabel, modernInvoiceNumber, domainName,
  rows, getQty, subtotal, taxPercent, taxAmount, total,
  paymentInfoLines, issuedToLines, normalizedBankDetailsLines,
}) => {
  const { heading: paymentHeading, bodyLines: paymentBodyLines } =
    getBillFromHeadingAndBodyLines(data, paymentInfoLines)
  const { heading: issuedHeading, bodyLines: issuedBodyLines } =
    getIssuedToHeadingAndBodyLines(data, issuedToLines, domainName)

  return (
    <div
      className={ts.tsInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      <div className={ts.tsTopBar}>
        <div className={ts.tsWindowDots}>
          <div className={ts.tsDot} />
          <div className={ts.tsDot} />
          <div className={ts.tsDot} />
        </div>
        <div className={ts.tsFilePath}>
          ~/invoices/{isEnglish ? 'invoice' : 'rakhunok'}_{modernInvoiceNumber}.pdf
        </div>
        <div className={ts.tsBadge}>
          {isEnglish ? 'PENDING' : 'ОЧІКУЄ'}
        </div>
      </div>

      <div className={ts.tsHeader}>
        <div className={ts.tsBrand}>
          <div className={ts.tsBrandIcon}>
            <div className={ts.tsBrandIconBox}>OD</div>
            <div className={ts.tsBrandName}>
              {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
            </div>
          </div>
          <div className={ts.tsBrandSub}>digital_services.est</div>
        </div>
        <div className={ts.tsInvoiceHead}>
          <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
          <span className={ts.tsInvoiceNum}>id::{modernInvoiceNumber}</span>
        </div>
      </div>

      <div className={ts.tsMeta}>
        <div className={ts.tsMetaItem}>
          <span className={ts.tsMetaLabel}>issued_at</span>
          <span className={ts.tsMetaValue}>
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
          </span>
        </div>
        <div className={ts.tsMetaItem}>
          <span className={ts.tsMetaLabel}>due_date</span>
          <span className={ts.tsMetaValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
          </span>
        </div>
        <div className={ts.tsMetaItem}>
          <span className={ts.tsMetaLabel}>invoice_id</span>
          <span className={ts.tsMetaValue}>{modernInvoiceNumber}</span>
        </div>
        <div className={ts.tsMetaItem}>
          <span className={ts.tsMetaLabel}>currency</span>
          <span className={ts.tsMetaValue}>{currencyLabel}</span>
        </div>
      </div>

      <div className={ts.tsParties}>
        <div className={ts.tsPartyCard}>
          <div className={ts.tsPartyLabel}>
            {isEnglish ? 'Bill from' : 'Платіжні дані'}
          </div>
          {!!paymentHeading && (
            <div className={ts.tsPartyName}>{paymentHeading}</div>
          )}
          {paymentBodyLines.map((line: string, idx: number) => (
            <div
              key={`pi-${idx}`}
              className={
                !paymentHeading && idx === 0
                  ? ts.tsPartyName
                  : ts.tsPartyLine
              }
            >
              {line}
            </div>
          ))}

          {!!normalizedBankDetailsLines.length && (
            <div className={ts.tsBankCard}>
              {normalizedBankDetailsLines.map((line: string, idx: number) => {
                const sep = line.indexOf(':')
                if (sep < 0) {
                  return <div className={ts.tsBankLine} key={`bk-${idx}`}>{line}</div>
                }
                return (
                  <div className={ts.tsBankLine} key={`bk-${idx}`}>
                    <span className={ts.tsBankLineLabel}>{line.slice(0, sep + 1)}</span>
                    {line.slice(sep + 1)}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={ts.tsPartyCard}>
          <div className={ts.tsPartyLabel}>
            {isEnglish ? 'Issued to' : 'Отримувач'}
          </div>
          {!!issuedHeading && (
            <div className={ts.tsPartyName}>{issuedHeading}</div>
          )}
          {issuedBodyLines.map((line: string, idx: number) => (
            <div
              key={`it-${idx}`}
              className={
                !issuedHeading && idx === 0
                  ? ts.tsPartyName
                  : ts.tsPartyLine
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className={ts.tsTableWrap}>
        <table className={ts.tsTable}>
          <thead>
            <tr>
              <th>{isEnglish ? 'description' : 'опис'}</th>
              <th>{isEnglish ? 'rate' : 'ціна'}</th>
              <th>{isEnglish ? 'qty' : 'к-сть'}</th>
              <th>{isEnglish ? 'total' : 'сума'}</th>
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
                  <td>{Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className={ts.tsSummary}>
        <div className={ts.tsDates}>
          <div className={ts.tsDateRow}>
            <span>{isEnglish ? 'issued' : 'дата'}</span>
            <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
          </div>
          <div className={ts.tsDateRow}>
            <span>{isEnglish ? 'due' : 'строк'}</span>
            <strong>{dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}</strong>
          </div>
        </div>

        <div className={ts.tsTotalsCard}>
          {taxPercent > 0 && (
            <>
              <div className={ts.tsTotalRow}>
                <span>{isEnglish ? 'subtotal' : 'підсумок'}</span>
                <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
              </div>
              <div className={ts.tsTotalRow}>
                <span>vat_{taxPercent}%</span>
                <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
              </div>
            </>
          )}
          <div className={`${ts.tsTotalRow} ${ts.tsGrandTotal}`}>
            <span>{isEnglish ? 'TOTAL_DUE' : 'ДО_СПЛАТИ'}</span>
            <strong>
              {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className={ts.tsFooter}>
        <div className={ts.tsFooterLeft}>
          <div className={ts.tsFooterComment}>
            {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
          </div>
          <div className={ts.tsFooterStatus}>
            {isEnglish ? 'STATUS: AWAITING_PAYMENT' : 'СТАТУС: ОЧІКУЄ_ОПЛАТИ'}
          </div>
        </div>
        <div className={ts.tsSignatureBlock}>
          <div className={ts.tsSignatureLine}>______________</div>
          <div className={ts.tsSignatureCaption}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TechstudioTemplate
