import {
  Table,
  Form,
  FormInstance,
  Popconfirm,
  Button,
  Modal,
  Input,
} from 'antd'
import { FC, useState } from 'react'
import { ColumnProps } from 'antd/lib/table'
import { IPaymentTableData } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/tableData'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { getName } from '@utils/helpers'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import {
  MinusCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useCustomDataSource } from './useCustomDataSource'
import AmountComponent from './fields/AmountComponent'
import PriceComponent from './fields/PriceComponent'
import NameComponent from './fields/NameComponent'
import SumComponent from './fields/SumComponent'
import s from '../style.module.scss'

interface Props {
  form: FormInstance<any>
  edit: boolean
}

const PaymentPricesTable: FC<Props> = ({ edit }) => {
  const { paymentData, form } = usePaymentContext()
  const serviceId = Form.useWatch('service', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

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
      render: (__, record) => <NameComponent record={record} edit={edit} />,
    },
    {
      title: 'К-сть',
      dataIndex: 'amount',
      width: '30%',
      render: (__, record) => <AmountComponent record={record} edit={edit} />,
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
      render: (__, record) => <SumComponent record={record} />,
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

export default PaymentPricesTable
