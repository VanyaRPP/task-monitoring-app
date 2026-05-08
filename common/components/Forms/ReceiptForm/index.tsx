import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGeneratePdfMutation } from '@common/api/paymentApi/payment.api'
import PaymentPricesTable from '@components/Forms/AddPaymentForm/PaymentPricesTable'
import { usePaymentContext } from '@components/AddPaymentModal'
import numberToTextNumber from '@utils/numberToText'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import dayjs from 'dayjs'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import s from './style.module.scss'
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons'
import { message, Dropdown, MenuProps } from 'antd'
import { saveAs } from 'file-saver'

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
  const { company } = usePaymentContext()
  const newData = currPayment || paymentData
  const currency =
    newData?.currency || newData?.company?.currency || company?.currency || newData?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const componentRef = useRef()

  const [generatePdf, { isLoading: pdfLoading }] = useGeneratePdfMutation()

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { size: auto; margin: 8mm; }
      @media print { html, body { overflow: visible !important; } }
    `,
    documentTitle: `dov-${newData.invoiceNumber}`, 
  })

  const handleDownloadDirectly = async () => {
    const hideMsg = message.loading('Генеруємо PDF...', 0)
    try {
      const response = await generatePdf({ payments: [newData] })

      if ('data' in response && response.data) {
        const responseData = response.data
        
        const buffer = Buffer.from((responseData as any).buffer)
        const blob = new Blob([buffer as any], { type: `application/${(responseData as any).fileExtension}` })

        const newFileName = (responseData as any).fileName
          .replace(/\binv\b/i, 'dov')
          .replace('-inv-', '-dov-')

        const exactFileName = `${newFileName}.${(responseData as any).fileExtension}`

        if ('showSaveFilePicker' in window) {
          try {
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: exactFileName,
              types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
            })
            const writable = await fileHandle.createWritable()
            await writable.write(blob)
            await writable.close()
            hideMsg()
            return
          } catch (err: any) {
            hideMsg()
            if (err.name !== 'AbortError') message.error('Помилка при збереженні файлу')
            return
          }
        }
        saveAs(blob, exactFileName)
        hideMsg()
      } else {
        hideMsg()
        const serverMsg = (response as any).error?.data?.error
        message.error(serverMsg ? `PDF: ${serverMsg}` : 'Помилка генерації PDF')
      }
    } catch (error) {
      hideMsg()
      message.error('Несподівана помилка')
    }
  }

  const printMenuItems: MenuProps['items'] = [
    {
      key: 'print',
      label: 'Роздрукувати довідку',
      icon: <PrinterOutlined />,
      onClick: handlePrint,
    },
    {
      key: 'download',
      label: 'Зберегти довідку PDF',
      icon: <DownloadOutlined />,
      onClick: handleDownloadDirectly,
      disabled: pdfLoading,
    },
  ]

  return (
    <>
      <Dropdown 
        menu={{ items: printMenuItems }} 
        trigger={['click']} 
        placement="bottomRight"
      >
        <PrinterOutlined 
          className={s.print} 
          style={pdfLoading ? { opacity: 0.5, pointerEvents: 'none' } : {}}
        />
      </Dropdown>

      <div
        className={s.invoiceContainer}
        ref={componentRef as any}
        style={{ width: '100%', height: '100%', marginTop: '2em', marginRight: '1.5em', marginLeft: '1.5em' }}
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
              {(Number(newData?.generalSum || newData?.debit || 0)).toFixed(2)} {currencyLabel}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SumWithText({ data }: any) {
  const { company } = usePaymentContext()
  const currency = data?.company?.currency || company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const rest = numberToTextNumber(data?.generalSum || data?.debit)

  if (isEnglish) {
    return (
      <div className={s.payFixed}>
        Total in words:
        <div className={s.payBold}>
          {(Number(data?.generalSum || data?.debit || 0)).toFixed(2)} {currencyLabel}
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