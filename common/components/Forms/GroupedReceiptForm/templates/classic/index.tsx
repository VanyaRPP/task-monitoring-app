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
}) => {
  const providerDomainHeading = getDomainHeading(data, domainName)
  const recipientCompanyHeading = getRecipientCompanyHeading(data, companyLabel)

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
          {isEnglish ? 'Provider' : 'Постачальник'}
        </div>
        <pre className={cs.preLabel}>
          {data?.provider?.description?.trim()} <br />
          <br />
        </pre>
      </div>

      <div className={cs.receiverInfo}>
        <div className={cs.label}>{isEnglish ? 'Recipient' : 'Одержувач'}</div>
        <pre className={cs.preLabel}>
          {data?.reciever?.description?.trim()} <br />
          {data?.reciever?.adminEmails?.map((email: string) => (
            <div key={email}>
              {email} <br />
            </div>
          ))}
        </pre>
      </div>

      <div className={cs.providerInvoice}>
        <div className={cs.datecellTitle}>
          {isEnglish ? 'INVOICE №' : 'РАХУНОК №'} {data.invoiceNumber}
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
          {isEnglish ? 'Total payment amount:' : 'Загальна сума оплати:'}
          <div className={cs.payBoldSum}>
            {(+data?.generalSum || +data?.debit || 0).toFixed(2)}{' '}
            {currencyLabel}
          </div>
        </div>

        <div>
          {isEnglish ? 'Payment purpose:' : 'Призначення платежу:'}{' '}
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
    </div>
  )
}

export default ClassicTemplate
