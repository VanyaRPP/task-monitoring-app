import { FC, useEffect, useRef, useState } from 'react'
import { PrinterOutlined, TableOutlined, DownloadOutlined } from '@ant-design/icons'
import { Tooltip, message, Dropdown, MenuProps } from 'antd'
import dayjs from 'dayjs'
import styles from './styles.module.scss'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { useGeneratePdfMutation } from '@common/api/paymentApi/payment.api'
import { getCurrencyNames, normalizeCurrency } from '@utils/helpers'
import { usePaymentContext } from '@components/AddPaymentModal'
import { saveAs } from 'file-saver'
import {
  getDomainHeading,
  getRecipientCompanyHeading,
} from '@common/components/Forms/GroupedReceiptForm/templates/invoice-party-headings'

const PriceList: FC<{ data: IPayment }> = ({ data }) => {
  const [payment, setPayment] = useState(data)
  const [totalSum, setTotalSum] = useState(0)
  const [totalFractionSum, setTotalFractionSum] = useState(0)

  const [generatePdf, { isLoading: pdfLoading }] = useGeneratePdfMutation()

  useEffect(() => {
    setPayment(data)
  }, [data])

  useEffect(() => {
    const sum = payment.invoice.reduce((acc, item) => acc + Number(item.sum), 0)
    setTotalSum(sum)

    const [, fraction] = sum.toFixed(2).split('.')
    setTotalFractionSum(Number(fraction))
  }, [payment])

  const paymentCompany = payment?.company as { currency?: string } | string | undefined
  const companyCurrency = typeof paymentCompany === 'object' ? paymentCompany?.currency : undefined
  const currency = payment?.currency || companyCurrency || payment?.domain?.currency
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const currencyNames = getCurrencyNames(currency, isEnglish)

  const { company, showQuantityInPreview, setShowQuantityInPreview } = usePaymentContext()

  const domainNameFromContext =
    typeof company?.domain === 'object' && company?.domain !== null
      ? (company.domain as { name?: string }).name
      : undefined
  const domainHeading = getDomainHeading(payment, domainNameFromContext)
  const customerHeading = getRecipientCompanyHeading(
    payment,
    company?.companyName
  )

  const formatActNarrowSpace = (value: string | undefined) =>
    (value?.trim() || '').replace(/(:\s)/g, ':\u00A0')
  const introCustomerText = [
    customerHeading,
    formatActNarrowSpace(payment?.reciever?.description),
  ]
    .filter((s) => s.length > 0)
    .join(' ')
  const introProviderText = [
    domainHeading,
    formatActNarrowSpace(payment?.provider?.description),
  ]
    .filter((s) => s.length > 0)
    .join(' ')

  const componentRef = useRef()

  const printCompanyName = payment?.reciever?.companyName || 'RTP'
  const printFileName = `${printCompanyName}-act-${payment.invoiceNumber}`

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = printFileName

    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-act-container, #print-act-container * { visibility: visible; }
        #print-act-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 8mm !important;
        }
      }
    `
    document.head.appendChild(style)

    setTimeout(() => {
      window.print()
      document.title = originalTitle
      document.head.removeChild(style)
    }, 100)
  }

  const handleDownloadDirectly = async () => {
    const hideMsg = message.loading(isEnglish ? 'Generating PDF...' : 'Генеруємо PDF...', 0)
    try {
      const response = await generatePdf({ payments: [payment as any] })
      if ('data' in response && response.data) {
        const responseData = response.data as any

        const buffer = Buffer.from(responseData.buffer)
        const blob = new Blob([buffer as any], {
          type: `application/${responseData.fileExtension}`,
        })

        const newFileName = responseData.fileName
          .replace(/\binv\b/i, 'act')
          .replace('-inv-', '-act-')

        const exactFileName = `${newFileName}.${responseData.fileExtension}`

        if ('showSaveFilePicker' in window) {
          try {
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: exactFileName,
              types: [
                {
                  description: 'PDF Document',
                  accept: { 'application/pdf': ['.pdf'] },
                },
              ],
            })
            const writable = await fileHandle.createWritable()
            await writable.write(blob)
            await writable.close()
            hideMsg()
            return
          } catch (err: any) {
            hideMsg()
            if (err.name !== 'AbortError') {
              message.error(isEnglish ? 'Error saving file' : 'Помилка при збереженні файлу')
            }
            return
          }
        }
        saveAs(blob, exactFileName)
        hideMsg()
      } else {
        hideMsg()
        const serverMsg = (response as any).error?.data?.error
        message.error(serverMsg ? `PDF: ${serverMsg}` : (isEnglish ? 'Error generating PDF' : 'Сталася помилка під час генерації PDF'))
      }
    } catch (error) {
      hideMsg()
      message.error(isEnglish ? 'Unexpected error' : 'Несподівана помилка')
    }
  }

  const printMenuItems: MenuProps['items'] = [
    {
      key: 'print',
      label: isEnglish ? 'Print act' : 'Роздрукувати акт',
      icon: <PrinterOutlined />,
      onClick: handlePrint,
    },
    {
      key: 'download',
      label: isEnglish ? 'Save act PDF' : 'Зберегти акт PDF',
      icon: <DownloadOutlined />,
      onClick: handleDownloadDirectly,
      disabled: pdfLoading,
    },
  ]

  return (
    <>
      <Tooltip
        title={
          isEnglish
            ? 'Show quantity and price columns in the act table'
            : 'Показувати кількість і ціну в таблиці акту'
        }
      >
        <TableOutlined
          role="button"
          tabIndex={0}
          aria-label={
            showQuantityInPreview
              ? isEnglish
                ? 'Hide quantity and price in act table'
                : 'Приховати кількість і ціну в акті'
              : isEnglish
                ? 'Show quantity and price in act table'
                : 'Показати кількість і ціну в акті'
          }
          aria-pressed={showQuantityInPreview}
          className={`${styles.tableDetailsToggle} ${showQuantityInPreview ? styles.tableDetailsToggleActive : ''}`}
          onClick={() => setShowQuantityInPreview(!showQuantityInPreview)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowQuantityInPreview(!showQuantityInPreview)
            }
          }}
        />
      </Tooltip>

      <Dropdown
        menu={{ items: printMenuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <PrinterOutlined
          className={styles.print}
          style={pdfLoading ? { opacity: 0.5, pointerEvents: 'none' } : {}}
        />
      </Dropdown>

      <div id="print-act-container" ref={componentRef as any}>
        <div
          className={styles.container}
          style={{
            width: '100%',
            height: '100%',
            marginRight: '0.5em',
            marginLeft: '0.5em',
          }}
        >
          <div className={styles.header}>
            <div className={styles.approvalSectionWrapper}>
              <div className={styles.approvalSection}>
                <div>
                  <strong>{isEnglish ? 'APPROVED' : 'ЗАТВЕРДЖУЮ'}</strong>
                  <br />
                  {!!domainHeading && (
                    <>
                      <strong>{domainHeading}</strong>
                      <br />
                    </>
                  )}
                  <pre>{payment.provider.description?.trim()}</pre>
                </div>
              </div>
              <div className={styles.approvalSection}>
                <div>
                  <strong>{isEnglish ? 'APPROVED' : 'ЗАТВЕРДЖУЮ'}</strong>
                  <br />
                  {!!customerHeading && (
                    <>
                      <strong>{customerHeading}</strong>
                      <br />
                    </>
                  )}
                  <pre>
                    {payment?.reciever?.description?.trim()} <br />
                    {payment?.reciever?.adminEmails?.map((email) => (
                      <div key={email}>
                        {email} <br />
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
              <div className={styles.approvalSection}>
                <br />
                <br />
                <hr />
              </div>
              <div className={styles.approvalSection}>
                <br />
                <br />
                <hr />
              </div>
            </div>
          </div>

          <div className={styles.titleSection}>
            <h1>
              <b>{isEnglish ? 'SERVICE ACCEPTANCE ACT' : 'АКТ надання послуг'}</b>
            </h1>
            <p>
              <b>
                {isEnglish ? 'No.' : '№'} {payment?.invoiceNumber}{' '}
                {isEnglish ? 'dated' : 'від'}{' '}
                {dayjs(payment?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
                {isEnglish ? '.' : ' року.'}
              </b>
            </p>
            <br />
            <hr />
          </div>

          <div className={styles.contentSection}>
            <p>
              {isEnglish ? (
                <>
                  We, the undersigned, the representative of the Customer{' '}
                  {introCustomerText}
                  , on one side, and the representative of the Provider{' '}
                  {introProviderText}
                  , on the other side, have executed this Act confirming that,
                  under the agreement, the Provider performed the following
                  services:
                </>
              ) : (
                <>
                  Ми, що нижче підписалися, представник Замовника{' '}
                  {introCustomerText}
                  , з одного боку, і представник Виконавця {introProviderText},
                  з іншого боку, склали цей акт про те, що на підставі
                  договору, Виконавцем були виконані наступні роботи (надані
                  такі послуги):
                </>
              )}
            </p>
          </div>

          <div style={{ marginTop: '1em' }}>
            <GroupedPricesTable
              preview
              usePreviewQuantityToggle
              domainId={payment?.domain?._id}
              currency={currency}
              invoices={payment.invoice}
            />
          </div>

          <div className={styles.contaiіner}>
            <div className={styles.contentSection}>
              <div>
                {isEnglish ? (
                  <>
                    The total cost of services excluding VAT is{' '}
                    {totalSum.toFixed(0)} {currencyNames.major}{' '}
                    {totalFractionSum} {currencyNames.minor}, VAT is 0{' '}
                    {currencyNames.major} 00 {currencyNames.minor}, and the
                    total cost including VAT is {totalSum.toFixed(0)}{' '}
                    {currencyNames.major} {totalFractionSum}{' '}
                    {currencyNames.minor}.
                    <br />
                    The Customer has no claims regarding the scope, quality, or
                    timing of the provided services.
                  </>
                ) : (
                  <>
                    Загальна вартість робіт (послуг) склала без ПДВ{' '}
                    {totalSum.toFixed(0)} {currencyNames.major}{' '}
                    {totalFractionSum} {currencyNames.minor}, ПДВ 0{' '}
                    {currencyNames.major} 00 {currencyNames.minor}, загальна
                    вартість робіт (послуг) із ПДВ {totalSum.toFixed(0)}{' '}
                    {currencyNames.major} {totalFractionSum}{' '}
                    {currencyNames.minor}.
                    <br />
                    Замовник претензій по об’єму, якості та строкам виконання
                    робіт (надання послуг) не має.
                  </>
                )}
              </div>
              <br />
            </div>
            <hr />
            <br />
            <div className={styles.signaturesSection}>
              <div className={styles.signatureBlock}>
                <div>
                  <b>{isEnglish ? 'Provider' : 'Від Виконавця'}</b>
                  <br />
                  {!!domainHeading && (
                    <>
                      <b>{domainHeading}</b>
                      <br />
                    </>
                  )}
                  <br />
                  <hr />
                  <br />
                  <b>
                    {new Date(payment.invoiceCreationDate).toLocaleDateString()}
                  </b>
                  <br />
                  <pre>{payment.provider.description?.trim()}</pre>
                </div>
              </div>
              <div className={styles.signatureBlock}>
                <div>
                  <b>{isEnglish ? 'Customer' : 'Від Замовника'}</b>
                  <br />
                  {!!customerHeading && (
                    <>
                      <b>{customerHeading}</b>
                      <br />
                    </>
                  )}
                  <br />
                  <hr />
                  <br />
                  <b>
                    {new Date(payment.invoiceCreationDate).toLocaleDateString()}
                  </b>
                  <br />
                  <pre>{payment.reciever.description?.trim()}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PriceList