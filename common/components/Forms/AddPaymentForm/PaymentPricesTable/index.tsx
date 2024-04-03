import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import Modal from '@common/components/UI/ModalWindow'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { getName } from '@utils/helpers'
import { Button, Form, Input, Popconfirm, Table } from 'antd'
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
  loading?: boolean
}

const PaymentPricesTable: React.FC<PaymentPricesTableProps> = ({
  edit,
  loading,
}) => {
  const { form, payment } = usePaymentContext()

  const [data, setData] = useState<Invoice[]>([])

  const addDataSource = (invoice: Invoice) => {
    // TODO: handle dataSourceUpdate
    // setData([...data, invoice])
    // form.setFieldValue(['invoice', invoice.name], invoice)
  }
  const removeDataSource = (name: string) => {
    // TODO: handle dataSourceUpdate
    // setData(data.filter((invoice) => invoice.name !== name))
    // form.setFieldValue(['invoice', name], null)
  }

  // const invoices = Form.useWatch('invoice', form)

  // useEffect(() => {
  //   if (!invoices) {
  //     const initialInvoices =
  //       payment?.invoice?.map((invoice) => ({
  //         ...invoice,
  //         name: invoice.name || invoice.type, // key
  //       })) || []

  //     console.log(initialInvoices)

  //     setData(initialInvoices)
  //   } else {
  //     setData(Object.values(form.getFieldValue('invoice') || {}))
  //   }
  // }, [invoices, payment, setData])

  useEffect(() => {
    const initialInvoices =
      payment?.invoice?.map((invoice) => ({
        ...invoice,
        name: invoice.name || invoice.type, // key
      })) || []

    setData(initialInvoices)
  }, [payment, setData])

  return (
    <>
      <Table
        rowKey="name"
        columns={getDefaultColumns({ edit, removeDataSource })}
        dataSource={data}
        pagination={false}
        className={s.table}
        loading={loading}
      />
      {edit && <AddCustomDataSource addDataSource={addDataSource} />}
    </>
  )
}

function getDefaultColumns({ edit, removeDataSource }): ColumnProps<Invoice>[] {
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
      render: (_, record) => (
        <div style={{ fontWeight: 600 }}>
          <SumComponent record={record} />
        </div>
      ),
      width: 110,
    },
  ]

  if (edit) {
    columns.push({
      render: (_, record) => (
        <Popconfirm
          title={`Ви впевнені що хочете видалити ${
            getName(record.name, paymentsTitle) || record.name
          }?`}
          onConfirm={() => removeDataSource(record.name)}
          cancelText="Відміна"
        >
          <MinusCircleOutlined className={s.icon} />
        </Popconfirm>
      ),
      width: 80,
    })
  }

  return columns
}

function AddCustomDataSource({ addDataSource }) {
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customFieldName, setCustomFieldName] = useState('')

  const addField = () => {
    addDataSource({
      type: ServiceType.Custom,
      name: customFieldName,
      amount: 0,
      price: 0,
    })
    setIsModalOpen(false)
    setCustomFieldName('')
  }

  return (
    <>
      <div className={s.popconfirm}>
        <Button
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          className={s.addButton}
        >
          Додати поле
        </Button>
      </div>

      <Modal
        title="Додати поле"
        open={isModalOpen}
        onOk={addField}
        changesForm={() => form.isFieldsTouched()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Input
          placeholder="Назва послуги"
          value={customFieldName}
          onChange={(e) => setCustomFieldName(e.target.value)}
        />
      </Modal>
    </>
  )
}

export default PaymentPricesTable
