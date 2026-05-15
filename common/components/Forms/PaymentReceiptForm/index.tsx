import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import numberToTextNumber from '@utils/numberToText'
import { getCurrencyShortLabel } from '@utils/helpers'
import dayjs from 'dayjs'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import s from './style.module.scss'
import { PrinterOutlined } from '@ant-design/icons'
import { theme } from 'antd'

interface Props {
  currPayment: IExtendedPayment
  paymentData: any
  paymentActions: { preview: boolean; edit: boolean }
}

const PaymentReceiptForm: FC<Props> = ({ currPayment, paymentData }) => {
  const newData = currPayment || paymentData
  const currency =
    newData?.currency || newData?.company?.currency || newData?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const componentRef = useRef()
  const { token } = theme.useToken()

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      (newData?.company?.companyName || newData?.reciever?.companyName) +
      '-payment-receipt-' +
      newData.invoiceNumber,
  })

  return (
    <>
      <PrinterOutlined className={s.print} onClick={handlePrint} />
      <div className={s.invoiceContainer} ref={componentRef}>
        <></>

        <div className={s.providerInvoice}>
          <div className={s.datecellTitle}>
            КВИТАНЦІЯ ПРО ОТРИМАННЯ ПЛАТЕЖУ № {newData.invoiceNumber}
          </div>
          <div className={s.datecellDate}>
            Від &nbsp;
            {dayjs(newData?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
            &nbsp; року.
          </div>
        </div>

        {newData?.transaction && (
          <div className={s.transactionInfo}>
            <div className={s.transactionTitle}>Платник:</div>
            <div className={s.payerDetails}>
              {[
                ...(newData?.reciever?.description?.trim() || '')
                  .split('\n')
                  .filter(Boolean)
                  .map((line, idx) => <div key={`desc-${idx}`}>{line}</div>),
                newData?.company?.companyName && (
                  <div key="companyName">{newData.company.companyName}</div>
                ),
                ...(newData?.company?.adminEmails || []).map((email) => (
                  <div key={email}>{email}</div>
                )),
              ].filter(Boolean)}
            </div>
            <br />
            <div className={s.transactionTitle}>Деталі транзакції:</div>
            <div className={s.transactionDetails}>
              <div>
                <strong>Рахунок платника:</strong>
                <span>{newData.transaction.AUT_CNTR_ACC}</span>
              </div>
              <div>
                <strong>Назва платника:</strong>
                <span>{newData.transaction.AUT_CNTR_NAM}</span>
              </div>
              <div>
                <strong>МФО банку:</strong>
                <span>{newData.transaction.AUT_CNTR_MFO}</span>
              </div>
              <div>
                <strong>Призначення платежу:</strong>
                <span>{newData.transaction.Description}</span>
              </div>
              <div className={s.payFixed}>
                <strong>Отримана сума:</strong>
                {(+newData?.generalSum || +newData?.debit).toFixed(2)}{' '}
                {currencyLabel}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default PaymentReceiptForm
