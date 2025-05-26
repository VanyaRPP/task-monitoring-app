import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import PaymentPricesTable from '@components/Forms/AddPaymentForm/PaymentPricesTable'
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
      <PrinterOutlined className={s.print} onClick={handlePrint} />
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

        <div className={s.providerInvoice}>
          <div className={s.datecellTitle}>
            ДОВІДКА № {newData.invoiceNumber}
          </div>
        </div>
        <div className={s.tableSum}>
          <PaymentPricesTable preview />
        </div>
        <div className={s.payTable}>
          <SumWithText data={newData} />
          <div className={s.payFixed}>
            Загальна сума:
            <div className={s.payBoldSum}>
              {(+newData?.generalSum || +newData?.debit).toFixed(2)} грн
            </div>
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

export default ReceiptForm
