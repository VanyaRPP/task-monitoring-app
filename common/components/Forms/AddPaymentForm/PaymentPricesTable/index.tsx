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
import { FC, useState } from 'react'
import { ColumnProps } from 'antd/lib/table'
import { IPaymentTableData } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/tableData'
import {
  ServiceType,
  inflicionDescription,
  maintenanceWithoutInflicionDescription,
  paymentsTitle,
} from '@utils/constants'
import { getName } from '@utils/helpers'
import s from './style.module.scss'
import useService from '@common/modules/hooks/useService'
import useCompany from '@common/modules/hooks/useCompany'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import {
  MinusCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useCustomDataSource } from './useCustomDataSource'
import { getDispalyedDate } from '../../ReceiptForm'
import PriceComponent from './fields/PriceComponent'
import AmountComponent from './fields/AmountComponent'
import SumComponent from './fields/SumComponent'
import StyledTooltip from '@common/components/UI/Reusable/StyledTooltip'

interface Props {
  form: FormInstance<any>
  edit: boolean
}

const PaymentPricesTable: FC<Props> = ({ edit }) => {
  const { paymentData, form } = usePaymentContext()

  const serviceId = Form.useWatch('service', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const inflicionPrice = Form.useWatch(['inflicionPrice', 'price'], form)

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
          <>
            <Tooltip title={`${nameRes || record.name} ${dateMonth}`}>
              <span className={s.rowText}>
                {nameRes || record.name}{' '}
                <span className={s.month}>{dateMonth}</span>
                {!!company?.servicePricePerMeter &&
                  nameRes === paymentsTitle.maintenancePrice && (
                    <span className={s.month}> індивідуальне</span>
                  )}
              </span>
            </Tooltip>
            {!!company?.inflicion &&
              nameRes === paymentsTitle.maintenancePrice && (
                <span className={s.rowText}>
                  <br />
                  <span className={s.month}>без врах.інд.інф </span>
                  <StyledTooltip
                    title={maintenanceWithoutInflicionDescription}
                  />
                </span>
              )}
            {paymentData?.company.inflicion &&
              nameRes === paymentsTitle.maintenancePrice && (
                <span className={s.rowText}>
                  <br />
                  <span className={s.month}>без врах.інд.інф </span>
                </span>
              )}
            {!!company?.inflicion &&
              nameRes === paymentsTitle.inflicionPrice && (
                <span className={s.rowText}>
                  {+inflicionPrice <= 0 && (
                    <>
                      <br />
                      <span className={s.month}>Спостерігається дефляція.</span>
                      <br />
                      <span className={s.month}>Значення незмінне</span>
                    </>
                  )}
                  <StyledTooltip title={inflicionDescription} />
                </span>
              )}
          </>
        )
      },
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
