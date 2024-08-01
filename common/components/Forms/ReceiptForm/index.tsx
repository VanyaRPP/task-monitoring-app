import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import PaymentPricesTable from '@components/Forms/AddPaymentForm/PaymentPricesTable'
import numberToTextNumber from '@utils/numberToText'
import { Button } from 'antd'
import dayjs from 'dayjs'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import s from './style.module.scss'

interface Props {
  currPayment: IExtendedPayment
  paymentData: any
  paymentActions: { preview: boolean; edit: boolean }
}

const ReceiptForm: FC<Props> = ({
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
      '-inv-' +
      newData.invoiceNumber,
  })

  return (
    <>
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
            <div className={s.label}>Постачальник</div>
            <pre>
              {newData?.provider?.description} <br />
              <br />
            </pre>
          </div>

          <div className={s.receiverInfo}>
            <div className={s.label}>Одержувач</div>
            <pre>
              {newData?.reciever?.description} <br />
              {newData?.reciever?.companyName} <br />
              {newData?.reciever?.adminEmails?.map((email) => (
                <div key={email}>
                  {email} <br />
                </div>
              ))}
            </pre>
          </div>
        </>

        <div className={s.providerInvoice}>
          <div className={s.datecellTitle}>
            INVOICE № INV-{newData.invoiceNumber}
          </div>
          <div className={s.datecellDate}>
            Від &nbsp;
            {dayjs(newData?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
            &nbsp; року.
          </div>
          <div className={s.datecell}>
            Підлягає сплаті до &nbsp;
            {dayjs(newData?.invoiceCreationDate)
              .add(5, 'd')
              .format('DD.MM.YYYY')}
            &nbsp; року
          </div>
        </div>
        <div className={s.tableSum}>
          <PaymentPricesTable preview />
        </div>
        <div className={s.payTable}>
          <SumWithText data={newData} />
          <div className={s.payFixed}>
            Загальна сума оплати:
            <div className={s.payBoldSum}>
              {(+newData?.generalSum || +newData?.debit).toFixed(2)} грн
            </div>
          </div>

          <div className={s.payFixed}>
            {newData?.provider?.description?.split('\n')?.[0] || ''}
            <div className={s.lineInner}>________________</div>
          </div>
        </div>

        <div className={s.endInfo}>
          <div className={s.endInfobolt}>Примітка:</div> *Ціна за комунальні
          послуги вказана з урахуванням ПДВ.
          <br />
          **Ціни на комунальні послуги виставляють компанії-постачальники,
          відповідно їх ціна може <br />
          змінюватись у будь-який час в односторонньму порядку
          компанією-постачальником.
        </div>
      </div>

      <Button type="primary" onClick={handlePrint}>
        {' '}
        Роздрукувати Документ
      </Button>
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

export default ReceiptForm
