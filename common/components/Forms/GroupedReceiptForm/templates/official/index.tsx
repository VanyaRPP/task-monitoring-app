import { FC } from 'react'
import dayjs from 'dayjs'
import { TemplateProps } from '../types'
import {
  getDomainHeading,
  getRecipientCompanyHeading,
} from '../invoice-party-headings'
import cl from './official.module.scss'

const OfficialTemplate: FC<TemplateProps> = ({
  data,
  componentRef,
  currencyLabel,
  modernInvoiceNumber,
  domainName: domainNameFromProps,
  companyLabel: companyLabelFromProps,
  rows,
  getQty,
  subtotal,
  taxPercent,
  taxAmount,
  total,
  paymentInfoLines: _paymentInfoLines,
  issuedToLines: _issuedToLines,
}) => {
  const domainLabel = getDomainHeading(data, domainNameFromProps)
  const clientCompany = getRecipientCompanyHeading(data, companyLabelFromProps)

  const subjectText =
    data?.notes ||
    (data?.invoiceCreationDate
      ? `Services rendered for ${dayjs(data.invoiceCreationDate).locale('en').format('MMMM YYYY')}`
      : `Invoice ${modernInvoiceNumber}`)

  return (
    <div
      className={cl.clInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      {/* ── Header ── */}
      <div className={cl.clHeader}>
        <div className={cl.clTitle}>Invoice</div>

        <div className={cl.clHeaderRight}>
          {!!domainLabel.trim() && (
            <div className={cl.clFromBlock}>
              <span className={cl.clFromLabel}>From</span>
              <div className={cl.clFromValue}>{domainLabel}</div>
            </div>
          )}
          {!!clientCompany && (
            <div className={cl.clToBlock}>
              <span className={cl.clToLabel}>Invoice For</span>
              <div className={cl.clToValue}>{clientCompany}</div>
            </div>
          )}
        </div>
      </div>

      <div className={cl.clMeta}>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>Invoice ID</div>
          <div className={cl.clMetaValue}>{modernInvoiceNumber}</div>
        </div>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>Issue Date</div>
          <div className={cl.clMetaValue}>
            {dayjs(data?.invoiceCreationDate).format('MM/DD/YYYY')}
          </div>
        </div>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>Due Date</div>
          <div className={cl.clMetaValue}>
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('MM/DD/YYYY')} (upon receipt)
          </div>
        </div>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>Subject</div>
          <div className={cl.clMetaValue}>{subjectText}</div>
        </div>
      </div>

      <div className={cl.clTableWrap}>
        <table className={cl.clTable}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
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
                  <td>{item?.name || item?.description || item?.type || '—'}</td>
                  <td>{qty?.toFixed?.(2) ?? qty}</td>
                  <td>{currencyLabel}&nbsp;{rate.toFixed(2)}</td>
                  <td>{currencyLabel}&nbsp;{Number(item?.sum || 0).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className={cl.clSummary}>
        <div className={cl.clTotals}>
          {taxPercent > 0 && (
            <>
              <div className={cl.clTotalRow}>
                <span>Subtotal</span>
                <strong>{currencyLabel}&nbsp;{subtotal.toFixed(2)}</strong>
              </div>
              <div className={cl.clTotalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>{currencyLabel}&nbsp;{taxAmount.toFixed(2)}</strong>
              </div>
            </>
          )}
          <div className={`${cl.clTotalRow} ${cl.clGrandTotal}`}>
            <span>Total Due</span>
            <strong>
              {currencyLabel}&nbsp;{(+data?.generalSum || +data?.debit || total).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfficialTemplate