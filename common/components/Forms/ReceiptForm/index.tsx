import React, { FC, useRef } from 'react'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import s from './style.module.scss'
import moment from 'moment'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useReactToPrint } from 'react-to-print'
import { renderCurrency } from '@common/components/DashboardPage/blocks/payments'
import { numberToTextNumber } from '@utils/helpers'

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

  // TODO: use real data from Domain, Company
  const data = { name: 'asd', email: 'asda', tel: '123' }
  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'emp-data',
  })

  const tt: DataType[] = [
    {
      id: 1,
      Назва: `Утримання  (${moment().format('MMMM')})`,
      Кількість: Number(newData?.maintenance?.amount),
      Ціна: Number(newData?.maintenance?.price),
      Сума: Number(newData?.maintenance?.sum),
    },
    {
      id: 2,
      Назва: `Розміщення  (${moment().format('MMMM')})`,
      Кількість: Number(newData?.placing?.amount),
      Ціна: Number(newData?.placing?.price),
      Сума: Number(newData?.placing?.sum),
    },
    {
      id: 3,
      Назва: `За водопостачання (${moment().format('MMMM')})`,
      Кількість:
        Number(newData?.water?.amount) - Number(newData?.water?.lastAmount),
      Ціна: Number(newData?.water?.price),
      Сума: Number(newData?.water?.sum),
    },
    {
      id: 4,
      Назва: `За електропостачання (${moment().format('MMMM')})`,
      Кількість:
        Number(newData?.electricity?.amount) -
        Number(newData?.electricity?.lastAmount),
      Ціна: Number(newData?.electricity?.price),
      Сума: Number(newData?.electricity?.sum),
    },
  ]

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
            <div>
              ТОВ &quot;Український центр дуальної освіти&quot; <br /> Адреса
              01030, м. Київ, вул. Б. Хмельницького, буд. 51Б <br />
              Реєстраційний номер 42637285 <br />є платником податку на прибуток
              на загальних підставах <br />
              <div className={s.info_adres__bold}>
                Р/р UA903052990000026006016402729 <br />
                АТ КБ «ПРИВАТБАНК» МФО: 311744
              </div>
            </div>
          </div>

          <div className={s.receiverInfo}>
            <div className={s.label}>Одержувач</div>
            <div>
              {data?.name} &nbsp;
              {data?.email} &nbsp;
              {data?.tel}
            </div>
          </div>
        </>
        <div className={s.providerInvoice}>
          <div className={s.datecellTitle}>INVOICE № INV-0060</div>

          <div className={s.datecellDate}>
            Від &nbsp;
            {String(newData?.date).slice(8, -14)}.
            {String(newData?.date).slice(5, -17)}.
            {String(newData?.date).slice(0, -20)} року.
          </div>
          <div className={s.datecell}>
            Підлягає сплаті до {String(newData?.date).slice(8, -14)}.
            {String(newData?.date).slice(5, -17)}.
            {String(newData?.date).slice(0, -20)} року.
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
              {numberToTextNumber(newData?.debit)} грн
            </div>
          </div>
          <div className={s.payFixed}>
            Загальна сума оплати:
            <div className={s.payBoldSum}>{newData?.debit} грн</div>
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
