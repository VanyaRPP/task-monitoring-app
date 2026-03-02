import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import { usePaymentContext } from '@components/AddPaymentModal'
import numberToTextNumber from '@utils/numberToText'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import dayjs from 'dayjs'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined, EditOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import s from './style.module.scss'

interface Props {
  currPayment?: IExtendedPayment | null
  paymentData?: IExtendedPayment | null | undefined
  paymentActions: { preview: boolean; edit: boolean }
}

const GroupedReceiptForm: FC<Props> = ({
  currPayment,
  paymentData,
  paymentActions,
}) => {
  const { company } = usePaymentContext()
  const rawData = currPayment ?? paymentData ?? null
  const data = rawData as any
  const currency =
    data?.company?.currency || company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'

  const componentRef = useRef<HTMLDivElement | null>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      (data?.company?.companyName ?? data?.reciever?.companyName ?? '') +
        '-inv-' +
        (data?.invoiceNumber ?? '') || 'invoice',
  })
  if (!rawData) {
    return null
  }

  return (
    <>
      <PrinterOutlined className={s.print} onClick={handlePrint} />

      <Tooltip title="Режим редагування">
        <EditOutlined className={s.edit} />
      </Tooltip>
      <div
        className={s.invoiceContainer}
        ref={componentRef}
        style={{
          width: '100%',
          height: '100%',
          marginTop: '2em',
          marginRight: '1.5em',
          marginLeft: '1.5em',
        }}
      >
        <>
          <div className={s.providerInfo}>
            <div className={s.label}>{isEnglish ? 'Provider' : 'Постачальник'}</div>
            <pre className={s.preLabel}>
              {data?.provider?.description?.trim()} <br />
              <br />
            </pre>
          </div>

          <div className={s.receiverInfo}>
            <div className={s.label}>{isEnglish ? 'Recipient' : 'Одержувач'}</div>
            <pre className={s.preLabel}>
              {data?.reciever?.description?.trim()} <br />
              {data?.reciever?.companyName} <br />
              {data?.reciever?.adminEmails?.map((email: string) => (
                <div key={email}>
                  {email} <br />
                </div>
              ))}
            </pre>
          </div>
        </>

        <div className={s.providerInvoice}>
          <div className={s.datecellTitle}>
            {isEnglish ? 'INVOICE №' : 'РАХУНОК №'} {data.invoiceNumber}
          </div>
          <div className={s.datecellDate}>
            {isEnglish ? 'dated' : 'Від'} &nbsp;
            {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
            {isEnglish ? '.' : ' року.'}
          </div>
          <div className={s.datecell}>
            {isEnglish ? 'Due by' : 'Підлягає сплаті до'} &nbsp;
            {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
            {!isEnglish && (
              <>
                &nbsp; року
              </>
            )}
          </div>
        </div>

        <div className={s.tableSum}>
          <GroupedPricesTable
            preview
            domainId={data?.domain?._id ?? data?.domain}
            currency={currency}
            invoices={data?.invoice ?? []}
          />
        </div>

        <div className={s.payTable}>
          <div className={s.payFixed}>
            {isEnglish ? 'Total payment amount:' : 'Загальна сума оплати:'}
            <div className={s.payBoldSum}>
              {(+data?.generalSum || +data?.debit || 0).toFixed(2)}{' '}
              {currencyLabel}
            </div>
          </div>

          <div>
            {isEnglish ? 'Payment purpose:' : 'Призначення платежу:'}{' '}
            <strong>
              {isEnglish
                ? `Payment for services according to invoice № ${data.invoiceNumber} dated ${dayjs(
                    data?.invoiceCreationDate
                  )?.format?.('DD.MM.YYYY')}`
                : `Оплата за послуги згідно рахунку № ${data.invoiceNumber} від ${dayjs(
                    data?.invoiceCreationDate
                  )?.format?.('DD.MM.YYYY')}`}
            </strong>
          </div>

          <div className={s.payFixed}>
            {data?.provider?.description?.split('\n')?.[0] || ''}
            <div className={s.lineInner}>________________</div>
          </div>
        </div>
      </div>
    </>
  )
}

function SumWithText({ data }: { data?: any }) {
  const { company } = usePaymentContext()
  const currency =
    data?.company?.currency || company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const rest = numberToTextNumber(data?.generalSum || data?.debit)

  if (isEnglish) {
    return (
      <div className={s.payFixed}>
        Total amount:
        <div className={s.payBold}>
          {(+data?.generalSum || +data?.debit || 0).toFixed(2)} {currencyLabel}
        </div>
      </div>
    )
  }

  return (
    rest && (
      <div className={s.payFixed}>
        Всього на суму:
        <div className={s.payBold}>
          {rest}
          &nbsp;{currencyLabel}
        </div>
      </div>
    )
  )
}

export default GroupedReceiptForm
