import React, { FC, useEffect, useState, useRef } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import s from './style.module.scss'
import { dataSource } from '@utils/tableData'
import moment from 'moment'
import { ObjectId } from 'mongoose'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useReactToPrint } from 'react-to-print'

interface Props {
  currPayment: IExtendedPayment
}

// function numToPr(number) {
//   const k = [
//       'одна тисяча',
//       'дві тисячі',
//       'три тисячі',
//       'чотири тисячі',
//       "п'ять тисяч",
//       'шість тисяч',
//       'сім тисяч',
//       'вісім тисяч',
//       "дев'ять тисяч",
//     ],
//     h = [
//       'сто',
//       'двісті',
//       'триста',
//       'чотириста',
//       "п'ятсот",
//       'шість сотень',
//       'сімсот',
//       'вісімсот',
//       "дев'ятсот",
//     ],
//     t = [
//       '',
//       'двадцять',
//       'тридцять',
//       'сорок',
//       "п'ятдесят",
//       'шістдесят',
//       'сімдесят',
//       'вісімдесят',
//       "дев'яносто",
//     ],
//     o = [
//       'один',
//       'два',
//       'три',
//       'чотири',
//       "п'ять",
//       'шість',
//       'сім',
//       'вісім',
//       "дев'ять",
//     ],
//     p = [
//       'одиннадцять',
//       'дванадцять',
//       'тринадцять',
//       'чотирнадцять',
//       "п'ятнадцять",
//       'шістнадцять',
//       'сімнадцять',
//       'вісімнадцять',
//       "де'ятнадцять",
//     ]
//   let str = number.toString(),
//     out = ''

//   if (str.length == 1) return o[number - 1]
//   else if (str.length == 2) {
//     if (str[0] == 1) out = p[parseInt(str[1]) - 1]
//     else
//       out =
//         t[parseInt(str[0]) - 1] +
//         (str[1] != '0' ? ' ' + o[parseInt(str[1]) - 1] : '')
//   } else if (str.length == 3) {
//     out =
//       h[parseInt(str[0]) - 1] +
//       (str[1] != '0' ? ' ' + t[parseInt(str[1]) - 1] : '') +
//       (str[2] != '0' ? ' ' + o[parseInt(str[2]) - 1] : '')
//   } else if (str.length == 4) {
//     out =
//       k[parseInt(str[0]) - 1] +
//       (str[1] != '0' ? ' ' + h[parseInt(str[1]) - 1] : '') +
//       (str[2] != '0' ? ' ' + t[parseInt(str[2]) - 1] : '') +
//       (str[3] != '0' ? ' ' + o[parseInt(str[3]) - 1] : '')
//   }

//   let arr = out.split('')
//   arr[0] = arr[0].toUpperCase()
//   out = arr.join('')
//   return out
// }

interface DataType {
  id: number
  Назва: string
  Кількість: number
  Ціна: number
  Сумма: number
}
const ReceiptForm: FC<Props> = ({ currPayment }) => {
  const { data } = useGetUserByIdQuery(String(currPayment?.payer))
  console.log(data)
  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'emp-data',
  })

  const columns: ColumnsType<DataType> = [
    {
      title: '№',
      dataIndex: 'id',
    },
    {
      title: 'Назва',
      dataIndex: 'Назва',
      key: 'Назва',
    },
    {
      title: 'Кількість',
      dataIndex: 'Кількість',
      key: 'Кількість',
    },
    {
      title: 'Ціна',
      key: 'Ціна',
      dataIndex: 'Ціна',
    },
    {
      title: 'Сумма',
      key: 'Сумма',
      dataIndex: 'Сумма',
    },
  ]

  const tt: DataType[] = [
    {
      id: 1,
      Назва: `Утримання  (${moment().format('MMMM')})`,
      Кількість: Number(currPayment?.maintenance?.amount),
      Ціна: Number(currPayment?.maintenance?.price),
      Сумма: Number(currPayment?.maintenance?.sum),
    },
    {
      id: 2,
      Назва: `Розміщення  (${moment().format('MMMM')})`,
      Кількість: Number(currPayment?.placing?.amount),
      Ціна: Number(currPayment?.placing?.price),
      Сумма: Number(currPayment?.placing?.sum),
    },
    {
      id: 3,
      Назва: `За водопостачання (${moment().format('MMMM')})`,
      Кількість:
        Number(currPayment?.water?.amount) -
        Number(currPayment?.water?.lastAmount),
      Ціна: Number(currPayment?.water?.price),
      Сумма: Number(currPayment?.water?.sum),
    },
    {
      id: 4,
      Назва: `За електропостачання (${moment().format('MMMM')})`,
      Кількість:
        Number(currPayment?.electricity?.amount) -
        Number(currPayment?.electricity?.lastAmount),
      Ціна: Number(currPayment?.electricity?.price),
      Сумма: Number(currPayment?.electricity?.sum),
    },
  ]
  return (
    <>
      <div
        ref={componentRef}
        style={{
          width: '100%',
          height: '100',
          marginTop: '2em',
          marginLeft: '1.5em',
        }}
      >
        <>
          <div className={s.info_order}>Постачальник</div>
          <div className={s.info_adres}>
            ТОВ "Український центр дуальної освіти" <br /> Adress 01030, м.
            Київ, вул. Б. Хмельницького, буд. 51Б <br />
            Registatipn number 42637285 <br />є платником податку на прибуток на
            загальних підставах <br />
            <div className={s.info_adres__bold}>
              Р/р UA903052990000026006016402729 <br />
              АТ КБ «ПРИВАТБАНК» МФО: 311744
            </div>
          </div>
          <div className={s.info_order_2}>Одержувач</div>
          <div className={s.info_user}>
            {data?.data.name} &nbsp;
            {data?.data.email} &nbsp;
            {data?.data.tel}
          </div>
        </>
        <div className={s.invoice_title}>INVOICE № INV-0060</div>

        <div className={s.invoice_data}>
          Від &nbsp;
          {String(currPayment?.date).slice(8, -14)}.
          {String(currPayment?.date).slice(5, -17)}.
          {String(currPayment?.date).slice(0, -20)} року.
        </div>
        <div className={s.invoice_end__pay}>
          Підлягає сплаті до {String(currPayment?.date).slice(8, -14)}.
          {String(currPayment?.date).slice(5, -17)}.
          {String(currPayment?.date).slice(0, -20)} року.
        </div>

        <div>
          <Table
            columns={columns}
            dataSource={tt}
            size="small"
            pagination={false}
          />
        </div>
        <div className={s.pay_table}>
          Всього на суму:
          <div className={s.pay_table_bold}>{currPayment?.debit} гривень</div>
        </div>
        <div className={s.pay_info}>
          Загальна сумма оплати:
          <div className={s.pay_info_money}>{currPayment?.debit}грн</div>
        </div>

        <div className={s.pay_admin}>
          Виписав Директор{' '}
          <div className={s.pay_admin__down}>
            _______________________________
          </div>
          <div className={s.pay_admin_name}>Єршов М.В.</div>
        </div>
        <div className={s.end_info}>
          <div className={s.end_info_bolt}>Примітка:</div> *Ціна за комунальні
          послуги вказана з урахуванням ПДВ.
          <br />
          **Ціни на комунальні послуги виставляють компанії-постачальники,
          відповідно їх ціна може змінюватись у <br />
          будь-який час в односторонньму порядку компанією-постачальником.
        </div>
      </div>
      <button className={s.button} onClick={handlePrint}>
        Роздрукувати Документ
      </button>
    </>
  )
}

export default ReceiptForm
