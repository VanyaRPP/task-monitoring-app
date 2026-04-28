import { FC, useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
} from '../invoice-party-headings'
import s from './olimp.module.scss'

const OlimpTemplate: FC<TemplateProps> = ({
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

  const [topInfoCardHeight, setTopInfoCardHeight] = useState<number>(0)
  const paymentInfoCardRef = useRef<HTMLDivElement | null>(null)

  const renderBankDetailsLine = (line: string) => {
    const trimmedLine = line?.trim?.() || ''
    const separatorIndex = trimmedLine.indexOf(':')

    const renderWithBoldUsd = (value: string) =>
      value.split(/(USD)/gi).map((chunk, idx) =>
        chunk.toUpperCase() === 'USD' ? (
          <span className={s.bankDetailsLabel} key={`usd-${idx}`}>
            {chunk}
          </span>
        ) : (
          chunk
        )
      )

    if (separatorIndex < 0) {
      return renderWithBoldUsd(trimmedLine)
    }

    const label = trimmedLine.slice(0, separatorIndex + 1)
    const value = trimmedLine.slice(separatorIndex + 1).trim()

    return (
      <>
        <span className={s.bankDetailsLabel}>{renderWithBoldUsd(label)}</span>
        {value ? <> {renderWithBoldUsd(value)}</> : ''}
      </>
    )
  }

  useEffect(() => {
    if (!paymentInfoCardRef.current) return

    const updateHeight = () => {
      const nextHeight = Math.ceil(
        paymentInfoCardRef.current?.getBoundingClientRect().height || 0
      )
      setTopInfoCardHeight(nextHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(paymentInfoCardRef.current)

    return () => observer.disconnect()
  }, [paymentInfoLines.length, paymentBodyLines.length, isEnglish])

  return (
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
          <div className={s.brandText}>
            <div>{data?.reciever?.companyName || ''}</div>
              <span className={s.dateOlimp}>
                {isEnglish ? 'Note:' : 'Примітка:'} {dayjs(data?.monthService.date)?.locale?.(isEnglish ? 'en' : 'uk')?.format?.( 'MMMM YYYY' )}
              </span>
          </div> 
        </div>
        <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'} №{modernInvoiceNumber}</h1>
      </div>

      <div className={s.invoiceInfoCard}>
        <div className={s.infoColumnStack}>
          <div
            ref={paymentInfoCardRef}
            className={`${s.infoColumn} ${s.infoCard} ${s.topInfoCard}`}
          >
            <h4>{isEnglish ? 'PAYMENT INFO:' : 'ПЛАТІЖНІ ДАНІ:'}</h4>
            <div className={s.infoList}>
              {!!paymentHeading && (
                <div className={`${s.infoLine} ${s.infoLineAccent}`}>
                  {paymentHeading}
                </div>
              )}
              {paymentBodyLines.map((line: string, idx: number) => (
                <div
                  className={
                    !paymentHeading && idx === 0
                      ? `${s.infoLine} ${s.infoLineAccent}`
                      : s.infoLine
                  }
                  key={`${line}-${idx}`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {!!normalizedBankDetailsLines.length && (
            <div className={`${s.infoColumn} ${s.infoCard} ${s.bankDetailsCard}`}>
              <div className={s.infoList}>
                {normalizedBankDetailsLines.map((line: string, idx: number) => (
                  <div
                    className={s.infoLine}
                    key={`${line}-${idx}`}
                  >
                    {renderBankDetailsLine(line)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={`${s.infoColumn} ${s.infoCard} ${s.topInfoCard} ${s.issuedToCard}`}
          style={
            topInfoCardHeight > 0 ? { height: `${topInfoCardHeight}px` } : undefined
          }
        >
          <h4>{isEnglish ? 'ISSUED TO:' : 'ОТРИМУВАЧ:'}</h4>
          <div className={s.infoList}>
            {!!issuedHeading && (
              <div className={`${s.infoLine} ${s.infoLineAccent}`}>
                {issuedHeading}
              </div>
            )}
            {issuedBodyLines.map((line: string, idx: number) => (
              <div
                className={
                  !issuedHeading && idx === 0
                    ? `${s.infoLine} ${s.infoLineAccent}`
                    : s.infoLine
                }
                key={`${line}-${idx}`}
              >
                {line}
              </div>
            ))}
          </div>
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
  )
}

export default OlimpTemplate
