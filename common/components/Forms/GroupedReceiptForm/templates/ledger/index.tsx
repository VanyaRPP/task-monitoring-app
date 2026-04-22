import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import lg from './ledger.module.scss'

const LedgerTemplate: FC<TemplateProps> = ({
  data, componentRef, isEnglish, currencyLabel, modernInvoiceNumber,
  rows, getQty, subtotal, taxPercent, taxAmount, total,
  paymentInfoLines, issuedToLines, normalizedBankDetailsLines,
}) => {
  return (
    <div
      className={lg.lgInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      <div className={lg.lgHeader}>
        <div className={lg.lgBrand}>
          <div className={lg.lgBrandName}>
            {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
          </div>
          <div className={lg.lgBrandSub}>Digital Services</div>
        </div>
        <div className={lg.lgInvoiceTitle}>
          <div className={lg.lgDocType}>
            {isEnglish ? 'Invoice' : 'Рахунок'}
          </div>
          <div className={lg.lgInvoiceNumber}>№ {modernInvoiceNumber}</div>
        </div>
      </div>

      <div className={lg.lgMeta}>
        <div className={lg.lgMetaCell}>
          <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Issue date' : 'Дата'}</div>
          <div className={lg.lgMetaCellValue}>
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
          </div>
        </div>
        <div className={lg.lgMetaCell}>
          <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</div>
          <div className={lg.lgMetaCellValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
          </div>
        </div>
        <div className={lg.lgMetaCell}>
          <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Invoice №' : 'Рахунок №'}</div>
          <div className={lg.lgMetaCellValue}>{modernInvoiceNumber}</div>
        </div>
        <div className={lg.lgMetaCell}>
          <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Currency' : 'Валюта'}</div>
          <div className={lg.lgMetaCellValue}>{currencyLabel}</div>
        </div>
      </div>

      <div className={lg.lgParties}>
        <div className={lg.lgPartyBox}>
          <div className={lg.lgPartyHeader}>
            {isEnglish ? 'Provider (Contractor)' : 'Підрядник'}
          </div>
          <div className={lg.lgPartyBody}>
            {paymentInfoLines.map((line: string, idx: number) => (
              <div
                key={`pi-${idx}`}
                className={idx === 0 ? lg.lgPartyName : lg.lgPartyLine}
              >
                {line}
              </div>
            ))}
            {!!normalizedBankDetailsLines.length && (
              <div className={lg.lgBankSection}>
                {normalizedBankDetailsLines.map((line: string, idx: number) => {
                  const sep = line.indexOf(':')
                  if (sep < 0) {
                    return <div className={lg.lgBankLine} key={`bk-${idx}`}>{line}</div>
                  }
                  return (
                    <div className={lg.lgBankLine} key={`bk-${idx}`}>
                      <span className={lg.lgBankLineLabel}>{line.slice(0, sep + 1)}</span>
                      {line.slice(sep + 1)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className={lg.lgPartyBox}>
          <div className={lg.lgPartyHeader}>
            {isEnglish ? 'Customer (Recipient)' : 'Замовник'}
          </div>
          <div className={lg.lgPartyBody}>
            {issuedToLines.map((line: string, idx: number) => (
              <div
                key={`it-${idx}`}
                className={idx === 0 ? lg.lgPartyName : lg.lgPartyLine}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={lg.lgTableWrap}>
        <table className={lg.lgTable}>
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
      </div>

      <div className={lg.lgSummary}>
        <div className={lg.lgDates}>
          <div className={lg.lgDatesHeader}>
            {isEnglish ? 'Dates' : 'Дати'}
          </div>
          <div className={lg.lgDatesBody}>
            <div className={lg.lgDateRow}>
              <span>{isEnglish ? 'Issued' : 'Дата'}</span>
              <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
            </div>
            <div className={lg.lgDateRow}>
              <span>{isEnglish ? 'Due' : 'Строк'}</span>
              <strong>{dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}</strong>
            </div>
          </div>
        </div>
        <div className={lg.lgTotalsBox}>
          <div className={lg.lgTotalsHeader}>
            {isEnglish ? 'Summary' : 'Підсумок'}
          </div>
          <div className={lg.lgTotalsBody}>
            {taxPercent > 0 && (
              <>
                <div className={lg.lgTotalRow}>
                  <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                  <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                </div>
                <div className={lg.lgTotalRow}>
                  <span>VAT {taxPercent}%</span>
                  <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                </div>
              </>
            )}
            <div className={`${lg.lgTotalRow} ${lg.lgGrandTotal}`}>
              <span>{isEnglish ? 'Total due' : 'До сплати'}</span>
              <strong>
                {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className={lg.lgFooter}>
        <div className={lg.lgFooterNote}>
          {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
        </div>
        <div className={lg.lgSignatureBlock}>
          <div className={lg.lgSignatureLine}>______________</div>
          <div className={lg.lgSignatureCaption}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LedgerTemplate
