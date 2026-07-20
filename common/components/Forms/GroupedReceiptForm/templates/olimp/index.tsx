import { FC, useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
} from '../invoice-party-headings'
import { getLabel, resolveTemplateChrome } from '../applyTemplateOverrides'
import EditableText from '../../EditableText'
import s from './olimp.module.scss'

const OlimpTemplate: FC<TemplateProps> = ({
  data,
  componentRef,
  isEnglish,
  currencyLabel,
  modernInvoiceNumber,
  domainName,
  showQuantityInPreview,
  rows,
  getQty,
  subtotal,
  taxPercent,
  taxAmount,
  total,
  paymentInfoLines,
  issuedToLines,
  normalizedBankDetailsLines,
  overrides,
}) => {
  const { accentColor, invoiceTitle, footerText } = resolveTemplateChrome(
    overrides,
    isEnglish
  )
  const L = (key: string, def: string) =>
    getLabel(overrides, key, def, isEnglish)
  const { heading: paymentHeading, bodyLines: rawPaymentBodyLines } =
    getBillFromHeadingAndBodyLines(data, paymentInfoLines)
  const { heading: issuedHeading, bodyLines: issuedBodyLines } =
    getIssuedToHeadingAndBodyLines(data, issuedToLines, domainName)

  const entrepreneurTitleSplitRegex =
    /^(private entrepreneur|private enterprise|fop|фоп|фізична особа\s*-?\s*підприємець)\s+(.+)$/i
  const paymentBodyLines = rawPaymentBodyLines.flatMap((line) => {
    const match = line.match(entrepreneurTitleSplitRegex)
    return match ? [match[1], match[2]] : [line]
  })

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
    <div className={s.invoiceContainer} ref={componentRef}>
      <div className={s.invoiceHeader}>
        <div className={s.brandBlock}>
          <div className={s.brandText}>
            <span className={s.dateOlimp}>
              {isEnglish ? 'Note:' : 'Примітка:'}{' '}
              {dayjs(data?.monthService?.date)
                ?.locale?.(isEnglish ? 'en' : 'uk')
                ?.format?.('MMMM YYYY')}
            </span>
          </div>
        </div>
        <h1 style={accentColor ? { color: accentColor } : undefined}>
          <EditableText
            valuePath="invoiceTitle"
            defaultValue={invoiceTitle ?? (isEnglish ? 'INVOICE' : 'РАХУНОК')}
          />{' '}
          №{modernInvoiceNumber}
        </h1>
      </div>

      <div className={s.invoiceInfoCard}>
        <div className={s.infoColumnStack}>
          <div
            ref={paymentInfoCardRef}
            className={`${s.infoColumn} ${s.infoCard} ${s.topInfoCard}`}
          >
            <h4>
              <EditableText
                fieldKey="paymentInfo.header"
                defaultValue={L(
                  'paymentInfo.header',
                  isEnglish ? 'PAYMENT INFO:' : 'ПЛАТІЖНІ ДАНІ:'
                )}
              />
            </h4>
            <div className={s.infoList}>
              <EditableText
                valuePath="receiverDescription"
                multiline
                defaultValue={data?.reciever?.description ?? ''}
              >
                {paymentBodyLines.map((line: string, idx: number) => {
                  const trimmed = line.trim().toLowerCase()
                  const isCompanyName =
                    !!paymentHeading &&
                    trimmed === paymentHeading.trim().toLowerCase()
                  const isEntrepreneurTitle =
                    /^(private entrepreneur|private enterprise|fop|фоп|фізична особа\s*-?\s*підприємець)$/i.test(
                      line.trim()
                    )
                  const accent = isCompanyName || isEntrepreneurTitle
                  return (
                    <div
                      className={
                        accent
                          ? `${s.infoLine} ${s.infoLineAccent}`
                          : s.infoLine
                      }
                      key={`${line}-${idx}`}
                    >
                      {line}
                    </div>
                  )
                })}
              </EditableText>
            </div>
          </div>

          {!!normalizedBankDetailsLines.length && (
            <div
              className={`${s.infoColumn} ${s.infoCard} ${s.bankDetailsCard}`}
            >
              <div className={s.infoList}>
                {normalizedBankDetailsLines.map((line: string, idx: number) => (
                  <div className={s.infoLine} key={`${line}-${idx}`}>
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
            topInfoCardHeight > 0
              ? { height: `${topInfoCardHeight}px` }
              : undefined
          }
        >
          <h4>
            <EditableText
              fieldKey="issuedTo.header"
              defaultValue={L(
                'issuedTo.header',
                isEnglish ? 'ISSUED TO:' : 'ОТРИМУВАЧ:'
              )}
            />
          </h4>
          <div className={s.infoList}>
            <EditableText
              valuePath="providerDescription"
              multiline
              defaultValue={data?.provider?.description ?? ''}
            >
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
            </EditableText>
          </div>
        </div>
      </div>
      <div className={s.tableWrapper}>
        <table className={s.invoiceTable}>
          <thead>
            <tr>
              <th>
                <EditableText
                  fieldKey="col.description"
                  defaultValue={L(
                    'col.description',
                    isEnglish ? 'DESCRIPTION' : 'ОПИС'
                  )}
                />
              </th>
              {showQuantityInPreview && (
                <>
                  <th className={s.colRate}>
                    <EditableText
                      fieldKey="col.rate"
                      defaultValue={L('col.rate', isEnglish ? 'RATE' : 'ЦІНА')}
                    />
                  </th>
                  <th className={s.colQty}>
                    <EditableText
                      fieldKey="col.qty"
                      defaultValue={L('col.qty', isEnglish ? 'QTY' : 'К-СТЬ')}
                    />
                  </th>
                </>
              )}
              <th className={s.colTotal}>
                <EditableText
                  fieldKey="col.total"
                  defaultValue={L('col.total', isEnglish ? 'TOTAL' : 'СУМА')}
                />
              </th>
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
                  <td>
                    {item?.name || item?.type || '-'}
                    {item?.description ? (
                      <div style={{ fontSize: '0.85em', opacity: 0.65 }}>
                        {item.description}
                      </div>
                    ) : null}
                  </td>
                  {showQuantityInPreview && (
                    <>
                      <td className={s.colRate}>{rate.toFixed(2)}</td>
                      <td className={s.colQty}>{qty}</td>
                    </>
                  )}
                  <td className={s.colTotal}>
                    {Number(item?.sum || 0).toFixed(2)} {currencyLabel}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className={s.summarySection}>
        <div className={s.invoiceDates}>
          <div className={s.infoRow}>
            <span>{isEnglish ? 'DATE:' : 'ДАТА:'}</span>
            <strong>
              {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
            </strong>
          </div>
          <div className={s.infoRow}>
            <span>{isEnglish ? 'DUE DATE:' : 'СТРОК ОПЛАТИ:'}</span>
            <strong>
              {dayjs(data?.invoiceCreationDate)
                .add(5, 'd')
                .format('DD.MM.YYYY')}
            </strong>
          </div>
        </div>

        <div className={s.totalsBlock}>
          {taxPercent > 0 && (
            <>
              <div className={s.totalRow}>
                <span>{isEnglish ? 'SUBTOTAL' : 'ПІДСУМОК'}</span>
                <strong>
                  {subtotal.toFixed(2)} {currencyLabel}
                </strong>
              </div>
              <div className={s.totalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>
                  {taxAmount.toFixed(2)} {currencyLabel}
                </strong>
              </div>
            </>
          )}
          <div className={`${s.totalRow} ${s.grandTotal}`}>
            <span>
              <EditableText
                fieldKey="totalLabel"
                defaultValue={L('totalLabel', isEnglish ? 'TOTAL' : 'ВСЬОГО')}
              />
            </span>
            <strong>
              {total.toFixed(2)} {currencyLabel}
            </strong>
          </div>
        </div>
      </div>

      <div className={s.footerNote}>
        <strong>
          <EditableText
            valuePath="footerText"
            defaultValue={footerText ?? (isEnglish ? 'THANK YOU' : 'ДЯКУЄМО')}
          />
        </strong>
        <div className={s.signatureLine}>______________</div>
      </div>
    </div>
  )
}

export default OlimpTemplate
