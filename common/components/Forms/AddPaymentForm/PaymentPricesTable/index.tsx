import {
  MinusCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { IPaymentTableData } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/tableData'
import {Popconfirm, Button, Table, Input, Form} from 'antd'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { ColumnProps } from 'antd/lib/table'
import { getName } from '@utils/helpers'
import { useState } from 'react'
import { useCustomDataSource } from './useCustomDataSource'
import AmountComponent from './fields/AmountComponent'
import PriceComponent from './fields/PriceComponent'
import NameComponent from './fields/NameComponent'
import SumComponent from './fields/SumComponent'
import s from '../style.module.scss'
import Modal from '@common/components/UI/ModalWindow'
import useService, { usePreviousMonthService, } from '@common/modules/hooks/useService'
import { usePaymentContext } from '@common/components/AddPaymentModal'

function PaymentPricesTable({ paymentActions }) {
  const { form, paymentData } = usePaymentContext()
  const { previousMonth } = usePreviousMonthService({
    date: paymentData?.monthService?.date || null,
    domainId: form.getFieldValue('domain') || null,
    streetId: form.getFieldValue('street') || null,
  })
  const {preview, edit} = paymentActions
  let { customDataSource, addDataSource, removeDataSource } =
    useCustomDataSource({ preview: paymentActions?.preview })

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
      render: (__, record) => (
        <NameComponent record={record} preview={preview} />
      ),
    },
    {
      title: 'К-сть',
      dataIndex: 'amount',
      width: '30%',
      render: (__, record) => (
        <AmountComponent record={record} edit={edit} />
      ),
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      width: '20%',
      render: (__, record) => (
        <PriceComponent
          record={record}
          edit={edit}
        />
      ),
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      ellipsis: true,
      render: (__, record) => <SumComponent record={record} />,
      width: 110,
    },
  ]

  /////////////////////
  if (!previousMonth) {
    customDataSource = customDataSource.filter(item => item.name !== 'inflicionPrice')
    customDataSource.forEach((item, index) => {
      item.id = index + 1
    })
  }
  /////////////////////

  if (!preview) {
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
      {!preview && <AddCustomField addDataSource={addDataSource} />}
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
