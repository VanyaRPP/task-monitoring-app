import { FC, useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import styles from './styles.module.scss'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import { IPayment } from '@common/api/paymentApi/payment.api.types'

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

  useEffect(() => {
    const sum = payment.invoice.reduce((acc, item) => acc + Number(item.sum), 0)
    setTotalSum(sum)

    const [, fraction] = sum.toFixed(2).split('.')
    setTotalFractionSum(Number(fraction))
  }, [payment])

  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      payment?.reciever?.companyName + '-inv-' + payment.invoiceNumber,
  })

  return (
    <>
      <PrinterOutlined className={styles.print} onClick={handlePrint} />
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
                  <strong>ЗАТВЕРДЖУЮ</strong>
                  <br />
                  <pre>{payment.provider.description?.trim()}</pre>
                </div>
              </div>
              <div className={styles.approvalSection}>
                <div>
                  <strong>ЗАТВЕРДЖУЮ</strong>
                  <br />
                  <pre>
                    {payment?.reciever?.description?.trim()} <br />
                    {payment?.reciever?.companyName} <br />
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
              <b>АКТ надання послуг</b>
            </h1>
            <p>
              <b>
                № {payment?.invoiceNumber} від{' '}
                {dayjs(payment?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}{' '}
                року.
              </b>
            </p>
            <br />
            <hr />
          </div>

          <div className={styles.contentSection}>
            <p>
              Ми, що нижче підписалися, представник Замовника{' '}
              {payment.reciever.description
                ?.trim()
                .replace(/(:\s)/g, ':\u00A0')}
              , з одного боку, і представник Виконавця{' '}
              {payment.provider.description
                ?.trim()
                .replace(/(:\s)/g, ':\u00A0')}
              , з іншого боку, склали цей акт про те, що на підставі договору,
              Виконавцем були виконані наступні роботи (надані такі послуги):
            </p>
          </div>

          <div style={{ marginTop: '1em' }}>
            <GroupedPricesTable
              preview
              domainId={payment?.domain?._id}
              invoices={payment.invoice}
            />
          </div>
          <div className={styles.container}>
            <div className={styles.contentSection}>
              <div>
                Загальна вартість робіт (послуг) склала без ПДВ{' '}
                {totalSum.toFixed(0)} гривень {totalFractionSum} копійок, ПДВ 0
                гривень 00 копійок, загальна вартість робіт (послуг) із ПДВ{' '}
                {totalSum.toFixed(0)} гривень {totalFractionSum} копійок.
                <br />
                Замовник претензій по об’єму, якості та строкам виконання робіт
                (надання послуг) не має.
              </div>
              <br />
            </div>
            <hr />
            <br />
            <div className={styles.signaturesSection}>
              <div className={styles.signatureBlock}>
                <div>
                  <b>Від Виконавця</b>
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
                  <b>Від Замовника</b>
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
