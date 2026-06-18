import { FC } from 'react'
import {
  dateToMonthYearEn,
  formatInvoiceDateUs,
  formatInvoiceDueDateUs,
} from '@assets/features/formatDate'
import { resolveServiceMonth } from './resolveServiceMonth'
import { TemplateProps } from '../types'
import {
  getDomainHeading,
  getRecipientCompanyHeading,
} from '../invoice-party-headings'
import { getLabel, resolveTemplateChrome } from '../applyTemplateOverrides'
import EditableText from '../../EditableText'
import { useInvoiceEditContext } from '../../InvoiceEditContext'
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
  overrides,
}) => {
  const domainLabel = getDomainHeading(data, domainNameFromProps)
  const clientCompany = getRecipientCompanyHeading(data, companyLabelFromProps)
  const { accentColor, invoiceTitle, footerText } = resolveTemplateChrome(
    overrides,
    true
  )
  const { editMode } = useInvoiceEditContext()
  const L = (key: string, def: string) => getLabel(overrides, key, def, true)

  const serviceMonth = resolveServiceMonth(
    data?.monthService,
    data?.invoiceCreationDate
  )

  const subjectText =
    data?.notes ||
    (serviceMonth
      ? `Services rendered for ${dateToMonthYearEn(serviceMonth)}`
      : `Invoice ${modernInvoiceNumber}`)

  return (
    <div
      className={cl.clInvoice}
      ref={componentRef}
      style={{ width: '100%', margin: '2em auto 1em' }}
    >
      {/* ── Header ── */}
      <div className={cl.clHeader}>
        <div
          className={cl.clTitle}
          style={accentColor ? { color: accentColor } : undefined}
        >
          <EditableText
            valuePath="invoiceTitle"
            defaultValue={invoiceTitle ?? 'Invoice'}
          />
        </div>

        <div className={cl.clHeaderRight}>
          {!!domainLabel.trim() && (
            <div className={cl.clFromBlock}>
              <span className={cl.clFromLabel}>
                <EditableText
                  fieldKey="from"
                  defaultValue={L('from', 'From')}
                />
              </span>
              <div className={cl.clFromValue}>{domainLabel}</div>
            </div>
          )}
          {!!clientCompany && (
            <div className={cl.clToBlock}>
              <span className={cl.clToLabel}>
                <EditableText
                  fieldKey="invoiceFor"
                  defaultValue={L('invoiceFor', 'Invoice For')}
                />
              </span>
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
            {formatInvoiceDateUs(data?.invoiceCreationDate)}
          </div>
        </div>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>Due Date</div>
          <div className={cl.clMetaValue}>
            {formatInvoiceDueDateUs(data?.invoiceCreationDate)} (upon receipt)
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
              <th>
                <EditableText
                  fieldKey="col.description"
                  defaultValue={L('col.description', 'Description')}
                />
              </th>
              <th>
                <EditableText
                  fieldKey="col.quantity"
                  defaultValue={L('col.quantity', 'Quantity')}
                />
              </th>
              <th>
                <EditableText
                  fieldKey="col.unitPrice"
                  defaultValue={L('col.unitPrice', 'Unit Price')}
                />
              </th>
              <th>
                <EditableText
                  fieldKey="col.amount"
                  defaultValue={L('col.amount', 'Amount')}
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
                  <td>{item?.name || item?.type || '—'}</td>
                  <td>{qty?.toFixed?.(2) ?? qty}</td>
                  <td>{rate.toFixed(2)}</td>
                  <td>{Number(item?.sum || 0).toFixed(2)}</td>
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
                <strong>
                  {currencyLabel}&nbsp;{subtotal.toFixed(2)}
                </strong>
              </div>
              <div className={cl.clTotalRow}>
                <span>VAT {taxPercent}%</span>
                <strong>
                  {currencyLabel}&nbsp;{taxAmount.toFixed(2)}
                </strong>
              </div>
            </>
          )}
          <div className={`${cl.clTotalRow} ${cl.clGrandTotal}`}>
            <span>
              <EditableText
                fieldKey="totalDue"
                defaultValue={L('totalDue', 'Total Due')}
              />
            </span>
            <strong>
              {currencyLabel}&nbsp;
              {(+data?.generalSum || +data?.debit || total).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {(!!footerText || editMode) && (
        <div style={{ marginTop: '1.5em', whiteSpace: 'pre-wrap' }}>
          <EditableText
            valuePath="footerText"
            multiline
            defaultValue={footerText ?? ''}
          />
        </div>
      )}
    </div>
  )
}

export default OfficialTemplate
