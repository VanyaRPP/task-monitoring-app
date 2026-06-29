import { FC } from 'react'
import dayjs from 'dayjs'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import {
  formatInvoiceDate,
  formatInvoiceDueDate,
} from '@common/assets/features/formatDate'
import { TemplateProps } from '../types'
import {
  getDomainHeading,
  getRecipientCompanyHeading,
} from '../invoice-party-headings'
import { getLabel, resolveTemplateChrome } from '../applyTemplateOverrides'
import EditableText from '../../EditableText'
import { useInvoiceEditContext } from '../../InvoiceEditContext'
import cs from './style.module.scss'

const ClassicTemplate: FC<TemplateProps> = ({
  data,
  componentRef,
  isEnglish,
  invoiceLang,
  currencyLabel,
  currency,
  domainName,
  companyLabel,
  rows: _rows,
  getQty: _getQty,
  subtotal: _subtotal,
  taxPercent: _taxPercent,
  taxAmount: _taxAmount,
  total: _total,
  paymentInfoLines: _paymentInfoLines,
  issuedToLines: _issuedToLines,
  normalizedBankDetailsLines: _normalizedBankDetailsLines,
  overrides,
  showQuantityInPreview,
}) => {
  const providerDomainHeading = getDomainHeading(data, domainName)
  const recipientCompanyHeading = getRecipientCompanyHeading(data, companyLabel)
  const { accentColor, invoiceTitle, footerText } = resolveTemplateChrome(
    overrides,
    isEnglish
  )
  const { editMode } = useInvoiceEditContext()
  const L = (key: string, def: string) =>
    getLabel(overrides, key, def, isEnglish)

  return (
    <div
      className={cs.invoiceContainer}
      ref={componentRef}
      style={{
        width: '100%',
        height: '100%',
        marginTop: '2em',
        marginRight: '1.5em',
        marginLeft: '1.5em',
      }}
    >
      <div className={cs.providerInfo}>
        <div className={cs.label}>
          <EditableText
            fieldKey="provider.title"
            defaultValue={L(
              'provider.title',
              isEnglish ? 'Provider' : 'Постачальник'
            )}
          />
        </div>
        <EditableText
          valuePath="providerDescription"
          multiline
          defaultValue={data?.provider?.description?.trim() ?? ''}
        >
          <pre className={cs.preLabel}>
            {data?.provider?.description?.trim()} <br />
            <br />
          </pre>
        </EditableText>
      </div>

      <div className={cs.receiverInfo}>
        <div className={cs.label}>
          <EditableText
            fieldKey="recipient.title"
            defaultValue={L(
              'recipient.title',
              isEnglish ? 'Recipient' : 'Одержувач'
            )}
          />
        </div>
        <EditableText
          valuePath="receiverDescription"
          multiline
          defaultValue={data?.reciever?.description?.trim() ?? ''}
        >
          <pre className={cs.preLabel}>
            {data?.reciever?.description?.trim()} <br />
            {data?.reciever?.adminEmails?.map((email: string) => (
              <div key={email}>
                {email} <br />
              </div>
            ))}
          </pre>
        </EditableText>
      </div>

      <div className={cs.providerInvoice}>
        <div
          className={cs.datecellTitle}
          style={accentColor ? { color: accentColor } : undefined}
        >
          <EditableText
            valuePath="invoiceTitle"
            defaultValue={invoiceTitle ?? (isEnglish ? 'INVOICE' : 'РАХУНОК')}
          />{' '}
          № {data.invoiceNumber}
        </div>
        <div className={cs.datecellDate}>
          {isEnglish ? 'Dated' : 'Від'} &nbsp;
          {formatInvoiceDate(data?.invoiceCreationDate)}
          {isEnglish ? '.' : ' року.'}
        </div>
        <div className={cs.datecell}>
          {isEnglish ? 'Due by' : 'Підлягає сплаті до'} &nbsp;
          {formatInvoiceDueDate(data?.invoiceCreationDate)}
          {!isEnglish && <>&nbsp; року</>}
        </div>
      </div>

      <div className={cs.tableSum}>
        <GroupedPricesTable
          preview
          usePreviewQuantityToggle
          showQuantityInPreview={showQuantityInPreview}
          domainId={data?.domain?._id ?? data?.domain}
          currency={currency}
          invoices={data?.invoice ?? []}
          invoiceLang={invoiceLang}
        />
      </div>

      <div className={cs.payTable}>
        <div className={cs.payFixed}>
          <EditableText
            fieldKey="totalLabel"
            defaultValue={L(
              'totalLabel',
              isEnglish ? 'Total payment amount:' : 'Загальна сума оплати:'
            )}
          />
          <div className={cs.payBoldSum}>
            {(+data?.generalSum || +data?.debit || 0).toFixed(2)}{' '}
            {currencyLabel}
          </div>
        </div>

        <div>
          <EditableText
            fieldKey="purposeLabel"
            defaultValue={L(
              'purposeLabel',
              isEnglish ? 'Payment purpose:' : 'Призначення платежу:'
            )}
          />{' '}
          <strong>
            {isEnglish
              ? `Payment for services according to invoice ${
                  data.invoiceNumber
                } dated ${dayjs(data?.invoiceCreationDate).format('DD-MM-YYYY')}`
              : `Оплата за послуги згідно рахунку ${
                  data.invoiceNumber
                } від ${dayjs(data?.invoiceCreationDate).format('DD-MM-YYYY')}`}
          </strong>
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

export default ClassicTemplate
