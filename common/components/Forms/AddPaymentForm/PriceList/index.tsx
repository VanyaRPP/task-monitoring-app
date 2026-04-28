import { FC, useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined, TableOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import dayjs from 'dayjs'
import styles from './styles.module.scss'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { getCurrencyNames, normalizeCurrency } from '@utils/helpers'
import { usePaymentContext } from '@components/AddPaymentModal'

const PriceList: FC<{ data: IPayment }> = ({ data }) => {
  const [payment, setPayment] = useState(data)
  const [totalSum, setTotalSum] = useState(0)
  const [totalFractionSum, setTotalFractionSum] = useState(0)

  useEffect(() => {
    setPayment(data)
  }, [data])

  useEffect(() => {
    const sum = payment.invoice.reduce((acc, item) => acc + Number(item.sum), 0)
    setTotalSum(sum)

    const [, fraction] = sum.toFixed(2).split('.')
    setTotalFractionSum(Number(fraction))
  }, [payment])

  const company = payment?.company as { currency?: string } | string | undefined
  const companyCurrency = typeof company === 'object' ? company?.currency : undefined
  const currency = companyCurrency || payment?.domain?.currency
  const currencyNames = getCurrencyNames(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'

  const { showQuantityInPreview, setShowQuantityInPreview } = usePaymentContext()

  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      payment?.reciever?.companyName + '-inv-' + payment.invoiceNumber,
  })

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
          className={`${styles.tableDetailsToggle} ${
            showQuantityInPreview ? styles.tableDetailsToggleActive : ''
          }`}
          onClick={() => setShowQuantityInPreview(!showQuantityInPreview)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowQuantityInPreview(!showQuantityInPreview)
            }
          }}
        />
      </Tooltip>
      
      <Tooltip title="Друк" placement="top">
        <PrinterOutlined className={styles.print} onClick={handlePrint} />
      </Tooltip>

      <div ref={componentRef}>
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
                  <pre>{payment.provider.description?.trim()}</pre>
                </div>
              </div>
              <div className={styles.approvalSection}>
                <div>
                  <strong>{isEnglish ? 'APPROVED' : 'ЗАТВЕРДЖУЮ'}</strong>
                  <br />
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
                  {payment.reciever.description
                    ?.trim()
                    .replace(/(:\s)/g, ':\u00A0')}
                  , on one side, and the representative of the Provider{' '}
                  {payment.provider.description
                    ?.trim()
                    .replace(/(:\s)/g, ':\u00A0')}
                  , on the other side, have executed this Act confirming that,
                  under the agreement, the Provider performed the following
                  services:
                </>
              ) : (
                <>
                  Ми, що нижче підписалися, представник Замовника{' '}
                  {payment.reciever.description
                    ?.trim()
                    .replace(/(:\s)/g, ':\u00A0')}
                  , з одного боку, і представник Виконавця{' '}
                  {payment.provider.description
                    ?.trim()
                    .replace(/(:\s)/g, ':\u00A0')}
                  , з іншого боку, склали цей акт про те, що на підставі
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