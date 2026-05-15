import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
} from '../invoice-party-headings'
import ml from './monoline.module.scss'

const MonolineTemplate: FC<TemplateProps> = ({
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
      className={ml.mlInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      <div className={ml.mlHeader}>
        <div className={ml.mlBrand}>
          <div className={ml.mlBrandName}>
            {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
          </div>
          <span className={ml.mlBrandRule} />
          <div className={ml.mlBrandSub}>Digital Services</div>
        </div>
        <div className={ml.mlInvoiceMeta}>
          <div className={ml.mlInvoiceWord}>
            {isEnglish ? 'Invoice' : 'Рахунок'}
          </div>
          <div className={ml.mlInvoiceNumber}>
            №&thinsp;{modernInvoiceNumber}
          </div>
        </div>
      </div>

      <div className={ml.mlDateRow}>
        <div className={ml.mlDateItem}>
          <span className={ml.mlDateLabel}>
            {isEnglish ? 'Issue date' : 'Дата'}
          </span>
          <span className={ml.mlDateValue}>
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
          </span>
        </div>
        <div className={ml.mlDateItem}>
          <span className={ml.mlDateLabel}>
            {isEnglish ? 'Due date' : 'Строк оплати'}
          </span>
          <span className={ml.mlDateValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
          </span>
        </div>
        <div className={ml.mlDateItem}>
          <span className={ml.mlDateLabel}>
            {isEnglish ? 'Currency' : 'Валюта'}
          </span>
          <span className={ml.mlDateValue}>{currencyLabel}</span>
        </div>
      </div>

      <div className={ml.mlParties}>
        <div className={ml.mlParty}>
          <div className={ml.mlPartyLabel}>
            {isEnglish ? 'Bill from' : 'Платіжні дані'}
          </div>
          {!!paymentHeading && (
            <div className={ml.mlPartyName}>{paymentHeading}</div>
          )}
          {paymentBodyLines.map((line: string, idx: number) => (
            <div
              key={`pi-${idx}`}
              className={
                !paymentHeading && idx === 0 ? ml.mlPartyName : ml.mlPartyLine
              }
            >
              {line}
            </div>
          ))}
          {!!normalizedBankDetailsLines.length && (
            <div className={ml.mlBankBlock}>
              {normalizedBankDetailsLines.map((line: string, idx: number) => {
                const sep = line.indexOf(':')
                if (sep < 0)
                  return (
                    <div className={ml.mlBankLine} key={`bk-${idx}`}>
                      {line}
                    </div>
                  )
                return (
                  <div className={ml.mlBankLine} key={`bk-${idx}`}>
                    <span className={ml.mlBankLineLabel}>
                      {line.slice(0, sep + 1)}
                    </span>
                    {line.slice(sep + 1)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className={ml.mlParty}>
          <div className={ml.mlPartyLabel}>
            {isEnglish ? 'Issued to' : 'Отримувач'}
          </div>
          {!!issuedHeading && (
            <div className={ml.mlPartyName}>{issuedHeading}</div>
          )}
          {issuedBodyLines.map((line: string, idx: number) => (
            <div
              key={`it-${idx}`}
              className={
                !issuedHeading && idx === 0 ? ml.mlPartyName : ml.mlPartyLine
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <table className={ml.mlTable}>
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

      <div className={ml.mlTotalsArea}>
        <div className={ml.mlPaymentNote}>
          <div className={ml.mlPaymentNoteLabel}>
            {isEnglish ? 'Payment purpose' : 'Призначення платежу'}
          </div>
          <div className={ml.mlPaymentNoteText}>
            {isEnglish
              ? `Payment for services according to invoice № ${
                  data.invoiceNumber
                } dated ${dayjs(data?.invoiceCreationDate)?.format?.(
                  'DD.MM.YYYY'
                )}`
              : `Оплата за послуги згідно рахунку № ${
                  data.invoiceNumber
                } від ${dayjs(data?.invoiceCreationDate)?.format?.(
                  'DD.MM.YYYY'
                )}`}
          </div>
        </div>
        <div className={ml.mlTotalsBlock}>
          {taxPercent > 0 && (
            <>
              <div className={ml.mlTotalRow}>
                <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                <strong>
                  {subtotal.toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
              <div className={ml.mlTotalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>
                  {taxAmount.toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </>
          )}
          <div className={`${ml.mlTotalRow} ${ml.mlGrandTotal}`}>
            <span>{isEnglish ? 'Total Due' : 'До сплати'}</span>
            <strong>
              {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;
              {currencyLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className={ml.mlFooter}>
        <div className={ml.mlFooterNote}>
          {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
        </div>
        <div className={ml.mlSignatureBlock}>
          <div className={ml.mlSignatureLine}>______________</div>
          <div className={ml.mlSignatureCaption}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonolineTemplate
