import {
  Table,
  Tooltip,
  Form,
  FormInstance,
  Popconfirm,
  Button,
  Modal,
  Input,
} from 'antd'
import { FC, useEffect, useState } from 'react'
import { ColumnProps } from 'antd/lib/table'
import { IPaymentTableData } from '@utils/tableData'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { getName } from '@utils/helpers'
import s from './style.module.scss'
import useService from '@common/modules/hooks/useService'
import useCompany from '@common/modules/hooks/useCompany'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useCustomDataSource } from './useCustomDataSource'
import { getDispalyedDate } from '../../ReceiptForm'
import PriceComponent from './fields/PriceComponent'
import AmountComponent from './fields/AmountComponent'
interface Props {
  form: FormInstance<any>
  edit: boolean
}

const PaymentPricesTable: FC<Props> = ({ edit }) => {
  const { paymentData, form } = usePaymentContext()

  const serviceId = Form.useWatch('service', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })

  const { customDataSource, addDataSource, removeDataSource } =
    useCustomDataSource({
      paymentData,
      companyId,
      serviceId,
      edit,
    } as any)

  const columns: ColumnProps<IPaymentTableData>[] = [
    {
      title: '№',
      dataIndex: 'id',
      width: '5%',
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      width: '30%',
      ellipsis: true,
      render: (name, record) => {
        const nameRes = getName(name, paymentsTitle)
        const dateMonth = getDispalyedDate(
          paymentData,
          service?.date,
          record.name
        )
        return (
          <Tooltip title={`${nameRes || record.name} ${dateMonth}`}>
            <span className={s.rowText}>
              {nameRes || record.name}{' '}
              <span className={s.month}>{dateMonth}</span>
              {!!company?.servicePricePerMeter && nameRes === 'Утримання' && (
                <span className={s.month}> індивідуальне</span>
              )}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'К-сть',
      dataIndex: 'amount',
      width: '30%',
      render: (text, record) => <AmountComponent record={record} edit={edit} />,
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      width: '20%',
      render: (__, record) => <PriceComponent record={record} edit={edit} />,
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      ellipsis: true,
      render: (text, record) => <SumWrapper record={record} form={form} />,
      width: 110,
    },
  ]

  if (!edit) {
    columns.push({
      title: (
        <div className={s.popconfirm}>
          <DeleteOutlined className={s.icon} />
        </div>
      ),
      dataIndex: 'delete',
      ellipsis: true,
      render: (text, record) => (
        <div className={s.popconfirm}>
          <Popconfirm
            title={`Ви впевнені що хочете видалити поле ${
              getName(record.name, paymentsTitle) || record.name
            }?`}
            onConfirm={() => removeDataSource(record.id)}
            cancelText="Відміна"
          >
            <MinusCircleOutlined className={s.icon} />
          </Popconfirm>
        </div>
      ),
      width: 80,
    })
  }

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={customDataSource as IPaymentTableData[]}
        pagination={false}
        className={s.table}
      />
      {!edit && <AddCustomField addDataSource={addDataSource} />}
    </>
  )
}

function AddCustomField({ addDataSource }) {
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

function SumWrapper({ record, form }) {
  const formFields = Form.useWatch(record.name, form)
  const valueToSet = getVal(record?.name, formFields) || record.sum

  useEffect(() => {
    form.setFieldValue([record.name, 'sum'], valueToSet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueToSet])

  return (
    <Form.Item name={[record?.name, 'sum']}>
      <h4 className={s.price}>{valueToSet} ₴</h4>
    </Form.Item>
  )
}

const getVal = (record, obj) => {
  switch (record) {
    case ServiceType.Maintenance: {
      const m = obj?.amount * obj?.price
      return +m.toFixed(1) || 0
    }
    case ServiceType.Placing: {
      // TODO: тут теж може бути прикол Індекс інфляції. Фікс прев"ю. Частина 5
      const p =
        obj?.amount === undefined ? obj?.price : obj?.amount * obj?.price
      return +p?.toFixed(1) || 0
    }
    case ServiceType.Electricity: {
      const e = (obj?.amount - obj?.lastAmount) * obj?.price
      return +e.toFixed(1) || 0
    }
    case ServiceType.Water: {
      const w = (obj?.amount - obj?.lastAmount) * obj?.price
      return +w.toFixed(1) || 0
    }
    case ServiceType.GarbageCollector: {
      const g =
        obj?.amount === undefined ? obj?.price : obj?.amount * obj?.price
      return +g?.toFixed(1) || 0
    }
    default: {
      return +obj?.price || 0
    }
  }
}

export default PaymentPricesTable
