import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
} from '../invoice-party-headings'
import sc from './softcard.module.scss'

const SoftcardTemplate: FC<TemplateProps> = ({
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
      className={sc.scInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      <div className={sc.scHeader}>
        <div className={sc.scBrand}>
          <div className={sc.scBrandName}>
            {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
          </div>
          <div className={sc.scBrandSub}>Digital Services</div>
        </div>
        <div className={sc.scInvoiceTitle}>
          <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
          <span className={sc.scInvoiceNum}>№&thinsp;{modernInvoiceNumber}</span>
        </div>
      </div>

      <div className={sc.scMeta}>
        <div className={sc.scMetaItem}>
          <span className={sc.scMetaLabel}>{isEnglish ? 'Date' : 'Дата'}</span>
          <span className={sc.scMetaValue}>
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
          </span>
        </div>
        <div className={sc.scMetaItem}>
          <span className={sc.scMetaLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
          <span className={sc.scMetaValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
          </span>
        </div>
        <div className={sc.scMetaItem}>
          <span className={sc.scMetaLabel}>{isEnglish ? 'Invoice №' : 'Рахунок №'}</span>
          <span className={sc.scMetaValue}>{modernInvoiceNumber}</span>
        </div>
        <div className={sc.scMetaItem}>
          <span className={sc.scMetaLabel}>{isEnglish ? 'Currency' : 'Валюта'}</span>
          <span className={sc.scMetaValue}>{currencyLabel}</span>
        </div>
      </div>

      <div className={sc.scParties}>
        <div className={sc.scPartyStack}>
          <div className={sc.scPartyCard}>
            <div className={sc.scPartyLabel}>
              {isEnglish ? 'Bill from' : 'Платіжні дані'}
            </div>
            {!!paymentHeading && (
              <div className={sc.scPartyName}>{paymentHeading}</div>
            )}
            {paymentBodyLines.map((line: string, idx: number) => (
              <div
                key={`pi-${idx}`}
                className={
                  !paymentHeading && idx === 0
                    ? sc.scPartyName
                    : sc.scPartyLine
                }
              >
                {line}
              </div>
            ))}

            {!!normalizedBankDetailsLines.length && (
              <div className={sc.scBankCard}>
                {normalizedBankDetailsLines.map((line: string, idx: number) => {
                  const sep = line.indexOf(':')
                  if (sep < 0) {
                    return (
                      <div className={sc.scBankLine} key={`bk-${idx}`}>
                        {line}
                      </div>
                    )
                  }
                  return (
                    <div className={sc.scBankLine} key={`bk-${idx}`}>
                      <span className={sc.scBankLineLabel}>{line.slice(0, sep + 1)}</span>
                      {line.slice(sep + 1)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className={sc.scPartyCard}>
          <div className={sc.scPartyLabel}>
            {isEnglish ? 'Issued to' : 'Отримувач'}
          </div>
          {!!issuedHeading && (
            <div className={sc.scPartyName}>{issuedHeading}</div>
          )}
          {issuedBodyLines.map((line: string, idx: number) => (
            <div
              key={`it-${idx}`}
              className={
                !issuedHeading && idx === 0 ? sc.scPartyName : sc.scPartyLine
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className={sc.scTableCard}>
        <table className={sc.scTable}>
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

      <div className={sc.scSummary}>
        <div className={sc.scDates}>
          <div className={sc.scDateRow}>
            <span>{isEnglish ? 'Date' : 'Дата'}</span>
            <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
          </div>
          <div className={sc.scDateRow}>
            <span>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
            <strong>
              {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
            </strong>
          </div>
        </div>

        <div className={sc.scTotalsCard}>
          {taxPercent > 0 && (
            <>
              <div className={sc.scTotalRow}>
                <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
              </div>
              <div className={sc.scTotalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
              </div>
            </>
          )}
          <div className={`${sc.scTotalRow} ${sc.scGrandTotal}`}>
            <span>{isEnglish ? 'Total due' : 'До сплати'}</span>
            <strong>
              {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className={sc.scFooter}>
        <div className={sc.scThankYou}>
          {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
        </div>
        <div className={sc.scSignatureBlock}>
          <div className={sc.scSignatureLine}>______________</div>
          <div className={sc.scSignatureCaption}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SoftcardTemplate
