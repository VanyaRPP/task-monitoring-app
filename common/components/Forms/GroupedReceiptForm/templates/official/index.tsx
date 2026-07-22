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
  isEnglish,
  currencyLabel,
  modernInvoiceNumber,
  domainName: domainNameFromProps,
  companyLabel: companyLabelFromProps,
  showQuantityInPreview,
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
    isEnglish
  )
  const { editMode } = useInvoiceEditContext()
  const L = (key: string, def: string) =>
    getLabel(overrides, key, def, isEnglish)

  const serviceMonth = resolveServiceMonth(
    data?.monthService,
    data?.invoiceCreationDate
  )

  const subjectText =
    data?.notes ||
    (serviceMonth
      ? `${isEnglish ? 'Services rendered for' : 'Послуги надані за'} ${dateToMonthYearEn(serviceMonth)}`
      : `${isEnglish ? 'Invoice' : 'Рахунок'} ${modernInvoiceNumber}`)

  return (
    <div className={cl.clInvoice} ref={componentRef}>
      {/* ── Header ── */}
      <div className={cl.clHeader}>
        <div
          className={cl.clTitle}
          style={accentColor ? { color: accentColor } : undefined}
        >
          <EditableText
            valuePath="invoiceTitle"
            defaultValue={invoiceTitle ?? (isEnglish ? 'Invoice' : 'Рахунок')}
          />
        </div>

        <div className={cl.clHeaderRight}>
          {!!domainLabel.trim() && (
            <div className={cl.clFromBlock}>
              <span className={cl.clFromLabel}>
                <EditableText
                  fieldKey="from"
                  defaultValue={L('from', isEnglish ? 'From' : 'Від')}
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
                  defaultValue={L(
                    'invoiceFor',
                    isEnglish ? 'Invoice For' : 'На адресу'
                  )}
                />
              </span>
              <div className={cl.clToValue}>{clientCompany}</div>
            </div>
          )}
        </div>
      </div>

      <div className={cl.clMeta}>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>
            {isEnglish ? 'Invoice ID' : 'Номер рахунку'}
          </div>
          <div className={cl.clMetaValue}>{modernInvoiceNumber}</div>
        </div>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>
            {isEnglish ? 'Issue Date' : 'Дата видачі'}
          </div>
          <div className={cl.clMetaValue}>
            {formatInvoiceDateUs(data?.invoiceCreationDate)}
          </div>
        </div>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>
            {isEnglish ? 'Due Date' : 'Строк оплати'}
          </div>
          <div className={cl.clMetaValue}>
            {formatInvoiceDueDateUs(data?.invoiceCreationDate)}{' '}
            {isEnglish ? '(upon receipt)' : '(при отриманні)'}
          </div>
        </div>
        <div className={cl.clMetaRow}>
          <div className={cl.clMetaLabel}>
            {isEnglish ? 'Subject' : 'Призначення'}
          </div>
          <div className={cl.clMetaValue}>{subjectText}</div>
        </div>
      </div>

      <div className={cl.clTableWrap} data-invoice-table-wrap>
        <table className={cl.clTable} data-invoice-table>
          <thead>
            <tr>
              <th>
                <EditableText
                  fieldKey="col.description"
                  defaultValue={L(
                    'col.description',
                    isEnglish ? 'Description' : 'Опис'
                  )}
                />
              </th>
              {showQuantityInPreview && (
                <>
                  <th className={`${cl.colNum} ${cl.colQty}`}>
                    <EditableText
                      fieldKey="col.quantity"
                      defaultValue={L(
                        'col.quantity',
                        isEnglish ? 'Quantity' : 'Кількість'
                      )}
                    />
                  </th>
                  <th className={`${cl.colNum} ${cl.colUnit}`}>
                    <EditableText
                      fieldKey="col.unitPrice"
                      defaultValue={L(
                        'col.unitPrice',
                        isEnglish ? 'Unit Price' : 'Ціна одиниці'
                      )}
                    />
                  </th>
                </>
              )}
              <th className={`${cl.colNum} ${cl.colAmount}`}>
                <EditableText
                  fieldKey="col.amount"
                  defaultValue={L('col.amount', isEnglish ? 'Amount' : 'Сума')}
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
                    {item?.name || item?.type || '—'}
                    {item?.description ? (
                      <div style={{ fontSize: '0.85em', opacity: 0.65 }}>
                        {item.description}
                      </div>
                    ) : null}
                  </td>
                  {showQuantityInPreview && (
                    <>
                      <td className={`${cl.colNum} ${cl.colQty}`}>
                        {qty?.toFixed?.(2) ?? qty}
                      </td>
                      <td className={`${cl.colNum} ${cl.colUnit}`}>
                        {rate.toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className={`${cl.colNum} ${cl.colAmount}`}>
                    {Number(item?.sum || 0).toFixed(2)}
                  </td>
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
                <span>{isEnglish ? 'Subtotal' : 'Сума без ПДВ'}</span>
                <strong>
                  {currencyLabel}&nbsp;{subtotal.toFixed(2)}
                </strong>
              </div>
              <div className={cl.clTotalRow}>
                <span>
                  {isEnglish ? 'VAT' : 'ПДВ'} {taxPercent}%
                </span>
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
                defaultValue={L(
                  'totalDue',
                  isEnglish ? 'Total Due' : 'Сума до оплати'
                )}
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
