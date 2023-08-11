import React, { FC, useRef } from 'react'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import s from './style.module.scss'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useReactToPrint } from 'react-to-print'
import { renderCurrency } from '@common/components/DashboardPage/blocks/payments'
import { filterInvoiceObject, numberToTextNumber } from '@utils/helpers'
import { getFormattedDate } from '@common/components/DashboardPage/blocks/services'
import { dateToDayYearMonthFormat } from '@common/assets/features/formatDate'
import useService from '@common/modules/hooks/useService'

interface Props {
  currPayment: IExtendedPayment
  paymentData: any
}

interface DataType {
  id: number
  Назва: string
  Кількість: number
  Ціна: number
  Сума: number
}

const columns: ColumnsType<DataType> = [
  {
    title: '№',
    dataIndex: 'id',
    width: '10%',
  },
  {
    title: 'Назва',
    dataIndex: 'Назва',
    width: '30%',
  },
  {
    title: 'Кількість',
    dataIndex: 'Кількість',
    width: '15%',
  },
  {
    title: 'Ціна',
    dataIndex: 'Ціна',
    width: '15%',
    render: renderCurrency,
  },
  {
    title: 'Сума',
    dataIndex: 'Сума',
    width: '15%',
    render: renderCurrency,
  },
]

const ReceiptForm: FC<Props> = ({ currPayment, paymentData }) => {
  const newData = currPayment || paymentData

  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'emp-data',
  })

  const { service } = useService({
    serviceId: newData?.monthService,
    domainId: newData?.domain,
    streetId: newData?.street,
    skip: !!paymentData,
  })

  const provider = newData?.provider
  const reciever = newData?.reciever

  const date = paymentData
    ? getFormattedDate(paymentData?.monthService?.date)
    : getFormattedDate(service?.date)

  const currentDate = newData?.date ? new Date(newData?.date) : new Date()
  const expirationDate = newData?.date ? new Date(newData?.date) : new Date()
  expirationDate.setDate(currentDate.getDate() + 5)

  const fieldNames = {
    maintenancePrice: 'Утримання',
    placingPrice: 'Розміщення',
    waterPrice: 'За водопостачання',
    electricityPrice: 'За електропостачання',
    garbageCollectorPrice: 'За вивіз ТПВ',
    inflicionPrice: 'Індекс інфляції',
  }

  const filteredInvoice = filterInvoiceObject(newData)

  const tt: DataType[] = paymentData
    ? newData?.invoice.map((item) => {
      return item.amount
        ? {
            id: newData?.invoice.indexOf(item) + 1,
            Назва: `${fieldNames[item.type] || item.name} (${date})`,
            Кількість: +item.amount,
            Ціна: +item.price,
            Сума: +item.sum,
          }
        : {
            id: newData?.invoice.indexOf(item) + 1,
            Назва: `${fieldNames[item.type] || item.name} (${date})`,
            Ціна: +item.price,
            Сума: +item.sum,
          }
      })
    : filteredInvoice.map((item) => {
      return item.amount
        ? {
            id: filteredInvoice.indexOf(item) + 1,
            Назва: `${fieldNames[item.type] || item.name} (${date})`,
            Кількість: +item.amount,
            Ціна: +item.price,
            Сума: +item.sum,
          }
        : {
            id: filteredInvoice.indexOf(item) + 1,
            Назва: `${fieldNames[item.type] || item.name} (${date})`,
            Ціна: item.price,
            Сума: item.sum,
          }
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
            {/* TODO: ЗАМІНИТИ НА ОДНЕ ПОЛЕ description */}
            <div>
              {provider?.name} <br />
              <br />
            </div>
          </div>

          <div className={s.receiverInfo}>
            <div className={s.label}>Одержувач</div>
            <div>
              {reciever?.companyName} <br />
              {reciever?.adminEmails?.map((email) => (
                <div key={email}>
                  {email} <br />
                </div>
              ))}
              {reciever?.phone}
            </div>
          </div>
        </>

        <div className={s.providerInvoice}>
          <div className={s.datecellTitle}>
            INVOICE № INV-{newData.invoiceNumber}
          </div>

          <div className={s.datecellDate}>
            Від &nbsp;
            {dateToDayYearMonthFormat(currentDate)}
            &nbsp; року.
          </div>
          <div className={s.datecell}>
            Підлягає сплаті до &nbsp;
            {dateToDayYearMonthFormat(expirationDate)}
            &nbsp; року.
          </div>
        </div>
        <div className={s.tableSum}>
          <Table
            columns={columns}
            dataSource={tt}
            size="small"
            pagination={false}
          />
        </div>
        <div className={s.payTable}>
          <div className={s.payFixed}>
            Всього на суму:
            <div className={s.payBold}>
              {numberToTextNumber(
                newData?.generalSum ? newData?.generalSum : newData?.debit
              )}{' '}
              грн
            </div>
          </div>
          <div className={s.payFixed}>
            Загальна сума оплати:
            <div className={s.payBoldSum}>
              {newData?.generalSum ? newData?.generalSum : newData?.debit} грн
            </div>
          </div>

          <div className={s.payFixed}>
            Виписав Директор{' '}
            <div className={s.lineInner}>_______________________________</div>
            <div className={s.payBoldInner}>Єршов М.В.</div>
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

export default ReceiptForm
