import { FC } from 'react'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import { formatInvoiceDate, formatInvoiceDueDate } from '@common/assets/features/formatDate'
import { TemplateProps } from '../types'
import cs from './style.module.scss'

const ClassicTemplate: FC<TemplateProps> = ({
  data,
  componentRef,
  isEnglish,
  currencyLabel,
  currency,
  rows,
  getQty,
  subtotal,
  taxPercent,
  taxAmount,
  total,
  paymentInfoLines,
  issuedToLines,
  normalizedBankDetailsLines,
}) => (
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
      <div className={cs.label}>{isEnglish ? 'Provider' : 'Постачальник'}</div>
      <pre className={cs.preLabel}>
        {data?.domain?.name && <><strong>{data.domain.name}</strong>{'\n'}</>}
        {data?.provider?.description?.trim()} <br />
        <br />
      </pre>
    </div>

    <div className={cs.receiverInfo}>
      <div className={cs.label}>{isEnglish ? 'Recipient' : 'Одержувач'}</div>
      <pre className={cs.preLabel}>
        {data?.reciever?.companyName && <><strong>{data.reciever.companyName}</strong>{'\n'}</>}
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
        {!isEnglish && (
          <>
            &nbsp; року
          </>
        )}
      </div>
    </div>

    <div className={cs.tableSum}>
      <GroupedPricesTable
        preview
        usePreviewQuantityToggle
        domainId={data?.domain?._id ?? data?.domain}
        currency={currency}
        invoices={data?.invoice ?? []}
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
            ? `Payment for services according to invoice № ${data.invoiceNumber} dated ${formatInvoiceDate(data?.invoiceCreationDate)}`
            : `Оплата за послуги згідно рахунку № ${data.invoiceNumber} від ${formatInvoiceDate(data?.invoiceCreationDate)}`}
        </strong>
      </div>

      <div className={cs.payFixed}>
        {data?.domain?.name || data?.provider?.description?.split('\n')?.[0] || ''}
      </div>
    </div>
  </div>
)

export default ClassicTemplate
