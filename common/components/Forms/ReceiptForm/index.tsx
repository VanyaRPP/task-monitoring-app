import React, { FC, useRef } from 'react'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import s from './style.module.scss'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useReactToPrint } from 'react-to-print'
import { renderCurrency } from '@common/components/DashboardPage/blocks/payments'
import { numberToTextNumber } from '@utils/helpers'
import { getFormattedDate } from '@common/components/DashboardPage/blocks/services'
import useServiceCompanyDomain from '@common/modules/hooks/useServiceCompanyDomain'
import { dateToDayYearMonthFormat } from '@common/assets/features/formatDate'

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
  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'emp-data',
  })

  const { company, service, domain } = useServiceCompanyDomain({
    serviceId: newData?.monthService,
    companyId: newData?.company,
    domainId: newData?.domain,
    streetId: newData?.street,
  })

  const date = getFormattedDate(service?.date)

  const currentDate = newData?.date ? new Date(newData?.date) : new Date()
  const expirationDate = newData?.date ? new Date(newData?.date) : new Date()
  expirationDate.setDate(currentDate.getDate() + 5)

  const fieldNames = {
    maintenancePrice: 'Утримання',
    placingPrice: 'Розміщення',
    waterPrice: 'За водопостачання',
    electricityPrice: 'За електропостачання',
  }

  const tt: DataType[] = paymentData
    ? newData?.invoice.map((item) => {
        return {
          id: newData?.invoice.indexOf(item) + 1,
          Назва: `${fieldNames[item.type]} (${date})`,
          Кількість: +item.amount,
          Ціна: +item.price,
          Сума: +item.sum,
        }
      })
    : [
        {
          id: 1,
          Назва: `Утримання  (${date})`,
          Кількість: Number(newData?.maintenancePrice?.amount),
          Ціна: Number(newData?.maintenancePrice?.price),
          Сума: Number(newData?.maintenancePrice?.sum),
        },
        {
          id: 2,
          Назва: `Розміщення  (${date})`,
          Кількість: Number(newData?.placingPrice?.amount),
          Ціна: Number(newData?.placingPrice?.price),
          Сума: Number(newData?.placingPrice?.sum),
        },
        {
          id: 3,
          Назва: `За водопостачання (${date})`,
          Кількість:
            Number(newData?.waterPrice?.amount) -
            Number(newData?.waterPrice?.lastAmount),
          Ціна: Number(newData?.waterPrice?.price),
          Сума: Number(newData?.waterPrice?.sum),
        },
        {
          id: 4,
          Назва: `За електропостачання (${date})`,
          Кількість:
            Number(newData?.electricityPrice?.amount) -
            Number(newData?.electricityPrice?.lastAmount),
          Ціна: Number(newData?.electricityPrice?.price),
          Сума: Number(newData?.electricityPrice?.sum),
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
              {domain[0]?.name} <br />
              Адреса {domain[0]?.address}
              <br />
              Реєстраційний номер ... <br />є платником податку на прибуток на
              загальних підставах <br />
              <div className={s.info_adres__bold}>
                {domain[0]?.bankInformation}
              </div>
            </div>
          </div>

          <div className={s.receiverInfo}>
            <div className={s.label}>Одержувач</div>
            <div>
              {company?.companyName} <br />
              {company?.adminEmails.map((email) => (
                <>
                  {email} <br />
                </>
              ))}
              {company?.phone}
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
