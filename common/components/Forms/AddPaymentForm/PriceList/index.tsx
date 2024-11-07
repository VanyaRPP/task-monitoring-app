import {
  IPayment,
  IPaymentField,
} from '@common/api/paymentApi/payment.api.types'
import { ServiceName } from '@utils/constants'
import { Button, Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { FC, useEffect, useRef, useState } from 'react'
import styles from './styles.module.scss'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined } from '@ant-design/icons'

interface InvoicesTableData extends IPaymentField {
  number: number
  unit: string
}

const columns: ColumnsType<InvoicesTableData> = [
  {
    title: '№',
    dataIndex: 'number',
    key: 'number',
  },
  {
    title: 'Найменування робіт, послуг',
    dataIndex: 'type',
    key: 'type',
    render: (value, record, index) => {
      return ServiceName[value]
    },
  },
  {
    title: 'Кіль-сть',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Од.',
    dataIndex: 'unit',
    key: 'unit',
  },
  {
    title: 'Ціна з ПДВ',
    dataIndex: 'price',
    key: 'price',
  },
  {
    title: 'Сума з ПДВ',
    dataIndex: 'sum',
    key: 'sum',
  },
]

const PriceList: FC<{ data: IPayment }> = ({ data }) => {
  const [payment, setPayment] = useState(data)
  const [totalSum, setTotalSum] = useState(0)
  const [totalFractionSum, setTotalFractionSum] = useState(0)

  const getModifiedInvoices = () => {
    return payment.invoice.map(
      (item, index) =>
        ({
          ...item,
          unit: 'грн',
          number: index + 1,
        } as InvoicesTableData)
    )
  }

  useEffect(() => {
    setTotalSum(
      payment.invoice.reduce((acc, item, index) => {
        acc += Number(item.sum)
        return acc
      }, 0)
    )
  }, [payment])

  useEffect(() => {
    const splitSum = totalSum.toFixed(2).split('.')
    setTotalFractionSum(Number(splitSum[1]))
  }, [totalSum])

  useEffect(() => {
    setPayment(data)
  }, [data])

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
        <div className={styles.container}>
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
                  <p>
                    <pre>
                      {payment?.reciever?.description?.trim()} <br />
                      {payment?.reciever?.companyName} <br />
                      {payment?.reciever?.adminEmails?.map((email) => (
                        <div key={email}>
                          {email} <br />
                        </div>
                      ))}
                    </pre>
                  </p>
                </div>
              </div>
              <div className={`${styles.approvalSection}`}>
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
              <b>№ 32 від 29 березня 2024 р.</b>
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
        </div>

        <Table
          columns={columns}
          dataSource={getModifiedInvoices()}
          pagination={false}
          summary={() => {
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  Всього:
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  {totalSum.toFixed(2)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />

        <div className={styles.container}>
          <div className={styles.contentSection}>
            <div>
              Загальна вартість робіт (послуг) склала без ПДВ{' '}
              {totalSum.toFixed(0)} гривень {totalFractionSum} копійок, ПДВ 0
              гривень 00 копійок, загальна вартість робіт (послуг) із ПДВ{' '}
              {totalSum.toFixed(0)} гривень {totalFractionSum} копійок.
              <br />
              Замовник претензій по об&apos;єму, якості та строкам виконання
              робіт (надання послуг) не має.
            </div>
          </div>
          <hr />
          <br />
          <br />
          <div className={styles.signaturesSection}>
            <div className={styles.signatureBlock}>
              <div>
                <b>Від Виконавця</b>
                <br />
                <br />
                <br />
                <hr />
                <br />
                <br />
                <b>
                  {new Date(payment.invoiceCreationDate).toLocaleDateString()}
                </b>{' '}
                <br />
                <pre>
                  {payment.provider.description?.trim()} <br />
                </pre>
              </div>
            </div>
            <div className={styles.signatureBlock}>
              <div>
                <b>Від Замовника</b>
                <br />
                <br />
                <br />
                <hr />
                <br />
                <br />
                <b>
                  {new Date(payment.invoiceCreationDate).toLocaleDateString()}
                </b>{' '}
                <br />
                <pre>{payment.reciever.description?.trim()}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PriceList
