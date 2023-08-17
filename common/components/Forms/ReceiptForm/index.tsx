import React, { FC, useRef, useState, useEffect } from 'react'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import s from './style.module.scss'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useReactToPrint } from 'react-to-print'
import { renderCurrency } from '@common/components/DashboardPage/blocks/payments'
import { filterInvoiceObject } from '@utils/helpers'
import numberToTextNumber from '@utils/numberToTextNumber'
import { getFormattedDate } from '@common/components/DashboardPage/blocks/services'
import { dateToDayYearMonthFormat } from '@common/assets/features/formatDate'
import useService from '@common/modules/hooks/useService'
import moment from 'moment'

interface Props {
  currPayment: IExtendedPayment
  paymentData: any
}

interface DataType {
  id: number
  // TODO: українською? - тут щось не так.
  Назва: string
  Кількість: number
  Ціна: number
  Сума: any
}

const ReceiptForm: FC<Props> = ({ currPayment, paymentData }) => {
  const newData = currPayment || paymentData
  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'emp-data',
  })

  // TODO: it is wrong to fetch all and to search
  // TODO: we need to take this data from prev. page, without fetching here
  const { service } = useService({
    serviceId: newData?.monthService,
    domainId: newData?.domain,
    streetId: newData?.street,
    skip: !!paymentData,
  })

  const date = getFormattedDate(
    paymentData ? paymentData?.monthService?.date : service?.date
  )

  const dataToMap = paymentData
    ? newData?.invoice
    : filterInvoiceObject(newData)

  const dataSourcePreview: DataType[] = dataToMap.map((item, index) => ({
    id: index + 1,
    Назва: `${fieldNames[item.type] || item.name} (${date})`,
    Кількість: item.amount && +item.amount,
    Ціна: +item.price,
    Сума: +item.sum,
  }))

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
            {moment(newData?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
            &nbsp; року.
          </div>
          <div className={s.datecell}>
            Підлягає сплаті до &nbsp;
            {moment(newData?.invoiceCreationDate)
              .add(5, 'd')
              .format('DD.MM.YYYY')}
            &nbsp; року
          </div>
        </div>
        <div className={s.tableSum}>
          <Table
            columns={columns}
            dataSource={dataSourcePreview}
            size="small"
            pagination={false}
          />
        </div>
        <div className={s.payTable}>
          <div className={s.payFixed}>
            Всього на суму:
            <div className={s.payBold}>
              {numberToTextNumber(newData?.generalSum || newData?.debit)}
              &nbsp;грн
            </div>
          </div>
          <div className={s.payFixed}>
            Загальна сума оплати:
            <div className={s.payBoldSum}>
              {calculatedGeneralSum || newData?.debit} грн
            </div>
          </div>

          <div className={s.payFixed}>
            {newData?.provider?.description?.split('\n')?.[0] || ''}
            <div className={s.lineInner}>_______________________________</div>
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

const fieldNames = {
  maintenancePrice: 'Утримання',
  placingPrice: 'Розміщення',
  waterPrice: 'За водопостачання',
  waterPart: 'За водопостачання (без лічильника)',
  electricityPrice: 'За електропостачання',
  garbageCollectorPrice: 'За вивіз ТПВ',
  inflicionPrice: 'Індекс інфляції',
}

export default ReceiptForm
