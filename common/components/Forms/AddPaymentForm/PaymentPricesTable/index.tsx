import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import Modal from '@common/components/UI/ModalWindow'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { getName } from '@utils/helpers'
import { Button, Form, Input, Popconfirm, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import { useEffect, useState } from 'react'
import s from '../style.module.scss'
import { AmountComponent } from './fields/AmountComponent'
import { NameComponent } from './fields/NameComponent'
import { PriceComponent } from './fields/PriceComponent'
import { SumComponent } from './fields/SumComponent'
import { usePaymentData } from './useCustomDataSource'

export interface Invoice {
  name: string
  title?: JSX.Element
  editable?: boolean
  data: {
    amount?: number
    price?: number
    sum?: number
  }
}

function PaymentPricesTable({ edit }) {
  const { form } = usePaymentContext()
  const { company, service, prevService } = usePaymentData({
    form,
  })

  const [data, setData] = useState<Invoice[]>([])

  const addDataSource = (dataSource: any) => {
    setData([
      ...data,
      {
        name:
          'name' in dataSource
            ? dataSource.name
            : 'type' in dataSource
            ? dataSource.type
            : 'unknown',
        editable: true,
        data: {
          amount: 'amount' in dataSource ? dataSource.amount : 0,
          price: 'price' in dataSource ? dataSource.price : 0,
        },
      },
    ])
  }
  const removeDataSource = (name: string) => {
    setData(
      data.filter(({ name }) => name.toLowerCase() !== name.toLowerCase())
    )
  }

  useEffect(() => {
    // TODO: prepare and update all math-based-data here
    setData([
      {
        name: 'maintenancePrice',
        title: <>Обслуговування</>,
        editable: true,
        data: {
          amount: 1231,
          price: 10,
        },
      },
      {
        name: 'placingPrice',
        title: <>Розміщення</>,
        data: {
          amount: 11,
          price: 50,
        },
      },
    ])
  }, [setData, company, service, prevService])

  useEffect(() => {
    data.forEach((record) => {
      const keys = Object.keys(record.data)
      keys.forEach((key) =>
        form.setFieldValue([record.name, key], record.data[key])
      )
    })
  }, [data, form])

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

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={false}
        className={s.table}
      />
      {edit && <AddCustomField addDataSource={addDataSource} />}
    </>
  )
}

function AddCustomField({ addDataSource }) {
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customFieldName, setCustomFieldName] = useState('')

  const addField = () => {
    addDataSource({
      type: ServiceType.Custom,
      name: customFieldName,
      amount: 1,
      id: 44,
      price: 0,
      sum: 0,
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
