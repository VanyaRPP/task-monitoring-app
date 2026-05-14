import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import PaymentPricesTable from '@components/Forms/AddPaymentForm/PaymentPricesTable'
import { usePaymentContext } from '@components/AddPaymentModal'
import PrintDownloadMenu from '@components/UI/PrintDownloadMenu'
import numberToTextNumber from '@utils/numberToText'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import { buildInvoiceFileName } from '@utils/pdf/paymentFileName'
import { usePdfDownload } from '@utils/pdf/usePdfDownload'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import s from './style.module.scss'
import { PrinterOutlined } from '@ant-design/icons'
import { message } from 'antd'

interface Props {
  currPayment: IExtendedPayment
  paymentData: any
  paymentActions: { preview: boolean; edit: boolean }
}

const ReceiptForm: FC<Props> = ({
  currPayment,
  paymentData,
  paymentActions: _paymentActions,
}) => {
  const { company } = usePaymentContext()
  const newData = currPayment || paymentData
  const currency =
    newData?.currency ||
    newData?.company?.currency ||
    company?.currency ||
    newData?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const componentRef = useRef<HTMLDivElement | null>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { size: auto; margin: 8mm; }
      @media print { html, body { overflow: visible !important; } }
    `,
    documentTitle: buildInvoiceFileName(newData, 'dov'),
  })

  const { download, isLoading: pdfLoading } = usePdfDownload({
    fileName: buildInvoiceFileName(newData, 'dov'),
    onError: (msg) => message.error(`PDF: ${msg}`),
  })

  const handleDownload = () => download(componentRef.current)

  return (
    <>
      <PrintDownloadMenu
        printLabel="Роздрукувати довідку"
        downloadLabel="Зберегти довідку PDF"
        onPrint={handlePrint}
        onDownload={handleDownload}
        loading={pdfLoading}
        trigger={
          <PrinterOutlined
            className={s.print}
            style={
              pdfLoading ? { opacity: 0.5, pointerEvents: 'none' } : undefined
            }
          />
        }
      />

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
            {isEnglish ? 'CERTIFICATE №' : 'ДОВІДКА №'} {newData.invoiceNumber}
          </div>
        </div>
        <div className={s.tableSum}>
          <PaymentPricesTable preview />
        </div>
        <div className={s.payTable}>
          <SumWithText data={newData} />
          <div className={s.payFixed}>
            {isEnglish ? 'Total amount:' : 'Загальна сума:'}
            <div className={s.payBoldSum}>
              {Number(newData?.generalSum || newData?.debit || 0).toFixed(2)}{' '}
              {currencyLabel}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SumWithText({ data }: any) {
  const { company } = usePaymentContext()
  const currency =
    data?.company?.currency || company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const rest = numberToTextNumber(data?.generalSum || data?.debit)

  if (isEnglish) {
    return (
      <div className={s.payFixed}>
        Total in words:
        <div className={s.payBold}>
          {Number(data?.generalSum || data?.debit || 0).toFixed(2)}{' '}
          {currencyLabel}
        </div>
      </div>
    )
  }

  return (
    rest && (
      <div className={s.payFixed}>
        Всього на суму:
        <div className={s.payBold}>
          {rest}&nbsp;{currencyLabel}
        </div>
      </div>
    )
  )
}

export default ReceiptForm
