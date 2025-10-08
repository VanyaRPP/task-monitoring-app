import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import numberToTextNumber from '@utils/numberToText'
import dayjs from 'dayjs'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import s from './style.module.scss'
import { PrinterOutlined } from '@ant-design/icons'

interface Props {
  currPayment: IExtendedPayment
  paymentData: any
  paymentActions: { preview: boolean; edit: boolean }
}

const PaymentReceiptForm: FC<Props> = ({
  currPayment,
  paymentData,
  paymentActions,
}) => {
  const newData = currPayment || paymentData
  const componentRef = useRef()
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
        <>
          <div className={s.providerInfo}>
            <div className={s.label}>Одержувач</div>
            <pre className={s.preLabel}>
              {newData?.reciever?.description?.trim()} <br />
              <br />
            </pre>
          </div>

          <div className={s.receiverInfo}>
            <div className={s.label}>Платник</div>
            <pre className={s.preLabel}>
              {newData?.company?.companyName}
              {newData?.company?.address && (
                <>
                  <br />
                  {newData?.company?.address}
                </>
              )}
              {newData?.company?.adminEmails?.map((email) => (
                <div key={email}>{email}</div>
              ))}
            </pre>
          </div>
        </>

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

        {/* Информация о транзакции */}
        {newData?.transaction && (
          <div className={s.transactionInfo}>
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
            </div>
          </div>
        )}

        <div className={s.payTable}>
          <SumWithText data={newData} />
          <div className={s.payFixed}>
            Отримана сума:
            <div className={s.payBoldSum}>
              {(+newData?.generalSum || +newData?.debit).toFixed(2)} грн
            </div>
          </div>

          <div>
            Призначення платежу:{' '}
            <strong>
              {newData?.description ||
                `Оплата за послуги згідно рахунку № ${
                  newData.invoiceNumber
                } від ${dayjs(newData?.invoiceCreationDate)?.format?.(
                  'DD.MM.YYYY'
                )}`}
            </strong>
          </div>

          <div className={s.payFixed}>
            {newData?.reciever?.description?.split('\n')?.[0] || ''}
            <div className={s.lineInner}>________________</div>
          </div>
        </div>
      </div>
    </>
  )
}

function SumWithText({ data }) {
  const rest = numberToTextNumber(data?.generalSum || data?.debit)
  return (
    rest && (
      <div className={s.payFixed}>
        Всього на суму:
        <div className={s.payBold}>
          {rest}
          &nbsp;грн
        </div>
      </div>
    )
  )
}

export default PaymentReceiptForm
