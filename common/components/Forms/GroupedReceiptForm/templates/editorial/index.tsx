import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import ed from './editorial.module.scss'

const EditorialTemplate: FC<TemplateProps> = ({
  data, componentRef, isEnglish, currencyLabel, modernInvoiceNumber,
  rows, getQty, subtotal, taxPercent, taxAmount, total,
  paymentInfoLines, issuedToLines, normalizedBankDetailsLines,
}) => {
  return (
    <div
      className={ed.edInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      <div className={ed.edHeader}>
        <div className={ed.edBrand}>
          <div className={ed.edBrandName}>
            {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
          </div>
          <div className={ed.edBrandSub}>Digital Services</div>
        </div>
        <div className={ed.edInvoiceTitle}>
          <h1>{isEnglish ? 'Invoice' : 'Рахунок'}</h1>
          <span className={ed.edInvoiceNum}>№&thinsp;{modernInvoiceNumber}</span>
        </div>
      </div>

      <div className={ed.edMeta}>
        <div className={ed.edMetaItem}>
          <span className={ed.edMetaLabel}>{isEnglish ? 'Date' : 'Дата'}</span>
          <span className={ed.edMetaValue}>
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
          </span>
        </div>
        <div className={ed.edMetaItem}>
          <span className={ed.edMetaLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
          <span className={ed.edMetaValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
          </span>
        </div>
        <div className={ed.edMetaItem}>
          <span className={ed.edMetaLabel}>{isEnglish ? 'Currency' : 'Валюта'}</span>
          <span className={ed.edMetaValue}>{currencyLabel}</span>
        </div>
      </div>

      <div className={ed.edParties}>
        <div className={ed.edParty}>
          <div className={ed.edPartyLabel}>
            {isEnglish ? 'Bill from' : 'Платіжні дані'}
          </div>
          {paymentInfoLines.map((line: string, idx: number) => (
            <div
              key={`pi-${idx}`}
              className={idx === 0 ? ed.edPartyName : ed.edPartyLine}
            >
              {line}
            </div>
          ))}
          {!!normalizedBankDetailsLines.length && (
            <div className={ed.edBankBlock}>
              {normalizedBankDetailsLines.map((line: string, idx: number) => {
                const sep = line.indexOf(':')
                if (sep < 0) {
                  return <div className={ed.edBankLine} key={`bk-${idx}`}>{line}</div>
                }
                return (
                  <div className={ed.edBankLine} key={`bk-${idx}`}>
                    <span className={ed.edBankLineLabel}>{line.slice(0, sep + 1)}</span>
                    {line.slice(sep + 1)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className={ed.edParty}>
          <div className={ed.edPartyLabel}>
            {isEnglish ? 'Issued to' : 'Отримувач'}
          </div>
          {issuedToLines.map((line: string, idx: number) => (
            <div
              key={`it-${idx}`}
              className={idx === 0 ? ed.edPartyName : ed.edPartyLine}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <table className={ed.edTable}>
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
                <td>{Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className={ed.edTotalsArea}>
        <div className={ed.edPaymentNote}>
          <div className={ed.edPaymentNoteLabel}>
            {isEnglish ? 'Payment purpose' : 'Призначення платежу'}
          </div>
          <div className={ed.edPaymentNoteText}>
            {isEnglish
              ? `Payment for services according to invoice № ${data.invoiceNumber} dated ${dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}`
              : `Оплата за послуги згідно рахунку № ${data.invoiceNumber} від ${dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}`}
          </div>
        </div>
        <div className={ed.edTotalsBlock}>
          {taxPercent > 0 && (
            <>
              <div className={ed.edTotalRow}>
                <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
              </div>
              <div className={ed.edTotalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
              </div>
            </>
          )}
          <div className={`${ed.edTotalRow} ${ed.edGrandTotal}`}>
            <span>{isEnglish ? 'Total Due' : 'До сплати'}</span>
            <strong>
              {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className={ed.edFooter}>
        <div className={ed.edFooterNote}>
          {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
        </div>
        <div className={ed.edSignatureBlock}>
          <div className={ed.edSignatureLine}>______________</div>
          <div className={ed.edSignatureCaption}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorialTemplate
