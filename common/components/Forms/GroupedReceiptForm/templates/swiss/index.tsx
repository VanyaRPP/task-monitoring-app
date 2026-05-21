import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
} from '../invoice-party-headings'
import sw from './swiss.module.scss'

const SwissTemplate: FC<TemplateProps> = ({
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
      className={sw.swissInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      <div className={sw.swissHeader}>
        <div className={sw.swissBrand}>
          <div className={sw.swissBrandName}>
            {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
          </div>
          <div className={sw.swissBrandSub}>Digital Services</div>
        </div>
        <div className={sw.swissInvoiceLabel}>
          <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
          <span className={sw.swissInvoiceNumber}>
            №&thinsp;{modernInvoiceNumber}
          </span>
        </div>
      </div>

      <div className={sw.swissMeta}>
        <div className={sw.swissMetaItem}>
          <span className={sw.swissMetaLabel}>
            {isEnglish ? 'Date' : 'Дата'}
          </span>
          <span className={sw.swissMetaValue}>
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
          </span>
        </div>
        <div className={sw.swissMetaItem}>
          <span className={sw.swissMetaLabel}>
            {isEnglish ? 'Due date' : 'Строк оплати'}
          </span>
          <span className={sw.swissMetaValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
          </span>
        </div>
        <div className={sw.swissMetaItem}>
          <span className={sw.swissMetaLabel}>
            {isEnglish ? 'Currency' : 'Валюта'}
          </span>
          <span className={sw.swissMetaValue}>{currencyLabel}</span>
        </div>
      </div>

      <div className={sw.swissParties}>
        <div className={sw.swissParty}>
          <div className={sw.swissPartyLabel}>
            {isEnglish ? 'Bill from' : 'Платіжні дані'}
          </div>
          {!!paymentHeading && (
            <div className={`${sw.swissPartyLine} ${sw.swissPartyLineStrong}`}>
              {paymentHeading}
            </div>
          )}
          {paymentBodyLines.map((line: string, idx: number) => (
            <div
              key={`pi-${idx}`}
              className={
                !paymentHeading && idx === 0
                  ? `${sw.swissPartyLine} ${sw.swissPartyLineStrong}`
                  : sw.swissPartyLine
              }
            >
              {line}
            </div>
          ))}
          {!!normalizedBankDetailsLines.length && (
            <div className={sw.swissBankCard}>
              {normalizedBankDetailsLines.map((line: string, idx: number) => {
                const sep = line.indexOf(':')
                if (sep < 0)
                  return (
                    <div className={sw.swissPartyLine} key={`bk-${idx}`}>
                      {line}
                    </div>
                  )
                return (
                  <div className={sw.swissPartyLine} key={`bk-${idx}`}>
                    <span className={sw.swissBankLabel}>
                      {line.slice(0, sep + 1)}
                    </span>
                    {line.slice(sep + 1)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className={sw.swissParty}>
          <div className={sw.swissPartyLabel}>
            {isEnglish ? 'Issued to' : 'Отримувач'}
          </div>
          {!!issuedHeading && (
            <div className={`${sw.swissPartyLine} ${sw.swissPartyLineStrong}`}>
              {issuedHeading}
            </div>
          )}
          {issuedBodyLines.map((line: string, idx: number) => (
            <div
              key={`it-${idx}`}
              className={
                !issuedHeading && idx === 0
                  ? `${sw.swissPartyLine} ${sw.swissPartyLineStrong}`
                  : sw.swissPartyLine
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <table className={sw.swissTable}>
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

      <div className={sw.swissTotals}>
        <div className={sw.swissTotalsBlock}>
          {taxPercent > 0 && (
            <>
              <div className={sw.swissTotalRow}>
                <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                <strong>
                  {subtotal.toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
              <div className={sw.swissTotalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>
                  {taxAmount.toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </>
          )}
          <div className={`${sw.swissTotalRow} ${sw.swissGrandTotal}`}>
            <span>{isEnglish ? 'Total due' : 'До сплати'}</span>
            <strong>
              {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;
              {currencyLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className={sw.swissFooter}>
        <div className={sw.swissThankYou}>
          {isEnglish ? 'Thank you' : 'Дякуємо'}
        </div>
        <div className={sw.swissSignatureBlock}>
          <div className={sw.swissSignatureLine}>______________</div>
          <div className={sw.swissSignatureCaption}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SwissTemplate
