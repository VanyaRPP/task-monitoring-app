import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { usePaymentData } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/useCustomDataSource'
import { Form, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import React, { useEffect, useState } from 'react'
import s from '../style.module.scss'
import { AmountComponent } from './fields/AmountComponent'
import { NameComponent } from './fields/NameComponent'
import { PriceComponent } from './fields/PriceComponent'
import { SumComponent } from './fields/SumComponent'

export interface Invoice {
  name?: string
  type: string
  lastAmount?: number
  amount?: number
  price?: number
  sum?: number
  company?: IRealestate
  payment?: IPayment
  prevPayment?: IPayment
  service?: IService
  prevService?: IService
}

export interface PaymentPricesTableProps {
  edit?: boolean
}

const PaymentPricesTable: React.FC<PaymentPricesTableProps> = ({ edit }) => {
  const { form, paymentData } = usePaymentContext()

  // const { service } = useService({ serviceId })
  // const { service: prevService } = usePrevService({ serviceId })
  // const { lastInvoice: payment } = useCompanyInvoice({ companyId })
  // const { lastInvoice: prevPayment } = useCompanyInvoice({
  //   companyId,
  //   year: new Date(payment?.invoiceCreationDate).getFullYear(),
  //   month: new Date(payment?.invoiceCreationDate).getMonth() - 1,
  // })

  const { company, service, prevService } = usePaymentData({ form })

  const [data, setData] = useState<Invoice[]>([])

  // const addDataSource = (invoice: Invoice) => {
  //   setData([...data, { ...invoice, company, service, prevService }])
  // }
  // const removeDataSource = (name: string) => {
  //   setData(data.filter((invoice) => invoice.name !== name))
  // }

  const invoices = Form.useWatch('invoice', form)

  useEffect(() => {
    setData(
      Object.entries(invoices || {}).map((entry: [string, any]) => ({
        type: entry[0],
        ...entry[1],
        company,
        service,
        prevService,
      }))
    )
  }, [invoices, setData])

  useEffect(() => {
    if (paymentData) {
      setData(
        paymentData?.invoice?.map((invoice) => ({
          ...invoice,
          name: invoice.name || invoice.type,
          company,
          service,
          prevService,
        })) || []
      )
    } else {
      // TODO: prepare base data template for NEW payments
    }
  }, [paymentData, setData])

  return (
    <>
      <Table
        rowKey="type"
        columns={getDefaultColumns({ edit })}
        dataSource={data}
        pagination={false}
        className={s.table}
      />
      {/* {edit && <AddCustomDataSource addDataSource={addDataSource} />} */}
    </>
  )
}

function getDefaultColumns({ edit }): ColumnProps<Invoice>[] {
  const columns: ColumnProps<Invoice>[] = [
    {
      title: '№',
      dataIndex: '_id',
      width: '5%',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      width: '30%',
      ellipsis: true,
      render: (_, record) => <NameComponent record={record} />,
    },
    {
      title: 'К-сть',
      dataIndex: 'amount',
      width: '30%',
      render: (_, record) => <AmountComponent record={record} edit={edit} />,
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      width: '20%',
      render: (_, record) => <PriceComponent record={record} edit={edit} />,
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      ellipsis: true,
      render: (_, record) => <SumComponent record={record} />,
      width: 110,
    },
  ]

  // if (edit) {
  //   columns.push({
  //     render: (_, record) => (
  //       <Popconfirm
  //         title={`Ви впевнені що хочете видалити ${
  //           getName(record.name, paymentsTitle) || record.name
  //         }?`}
  //         onConfirm={() => removeDataSource(record.name)}
  //         cancelText="Відміна"
  //       >
  //         <MinusCircleOutlined className={s.icon} />
  //       </Popconfirm>
  //     ),
  //     width: 80,
  //   })
  // }

  return columns
}

export default PaymentPricesTable
