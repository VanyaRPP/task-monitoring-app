import {
  Table,
  Tooltip,
  InputNumber,
  Form,
  FormInstance,
  Popconfirm,
  Button,
  Modal,
  Input,
} from 'antd'
import { FC, useEffect, useState } from 'react'
import { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import { IPaymentTableData } from '@utils/tableData'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { getName } from '@utils/helpers'
import { validateField } from '@common/assets/features/validators'
import s from './style.module.scss'
import { getFormattedDate } from '@common/components/DashboardPage/blocks/services'
import useService from '@common/modules/hooks/useService'
import {
  PriceElectricityField,
  PriceGarbageCollectorField,
  PriceInflicionField,
  PriceMaintainceField,
  PricePlacingField,
  PriceWaterField,
} from './fields/priceFields'
import useCompany from '@common/modules/hooks/useCompany'
import { AmountTotalAreaField } from './fields/amountFields'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useCustomDataSource } from './useCustomDataSource'
interface Props {
  form: FormInstance<any>
  edit: boolean
}

const PaymentPricesTable: FC<Props> = ({ edit }) => {
  const { paymentData, form } = usePaymentContext()
  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId = Form.useWatch('service', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, domainId, streetId, skip: edit })
  const { service } = useService({ serviceId, domainId, streetId, skip: edit })

  const { customDataSource, addDataSource, removeDataSource } =
    useCustomDataSource({
      paymentData,
      companyId,
      serviceId,
      domainId,
      streetId,
      edit,
    } as any)

  const columns: ColumnProps<IPaymentTableData>[] = [
    {
      title: '№',
      dataIndex: 'id',
      width: 50,
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      width: 'max-content',
      ellipsis: true,
      render: (name) => {
        const nameRes = getName(name, paymentsTitle)
        return (
          // TODO: use moment from helper (single access point)
          // getFormattedDate
          <Tooltip
            title={`${nameRes}(${moment(service?.date).format('MMMM')})`}
          >
            <span className={s.rowText}>
              {nameRes || name}{' '}
              <span className={s.month}>
                ({getFormattedDate(service?.date)})
              </span>
              {company?.servicePricePerMeter && nameRes === 'Утримання' && (
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
      render: (text, record) => (
        <>
          {record.name === ServiceType.Electricity ||
          record.name === ServiceType.Water ? (
            <div className={s.doubleInputs}>
              <Form.Item
                name={[record.name, 'lastAmount']}
                rules={validateField('required')}
              >
                <InputNumber disabled={edit} className={s.input} />
              </Form.Item>

              <Form.Item
                name={[record.name, 'amount']}
                rules={validateField('required')}
              >
                <InputNumber disabled={edit} className={s.input} />
              </Form.Item>
            </div>
          ) : (
            (record.name === ServiceType.Electricity ||
              record.name === ServiceType.Water ||
              record.name === ServiceType.Placing ||
              record.name === ServiceType.Maintenance) && (
              <AmountTotalAreaField record={record} edit={edit} />
            )
          )}
        </>
      ),
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      render: (text, record) => {
        if (record.name in fields) {
          const Component = fields[record.name]
          return <Component record={record} edit={edit} />
        }
        return <PriceWrapper record={record} form={form} edit={edit} />
      },
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      ellipsis: true,
      render: (text, record) => <SumWrapper record={record} form={form} />,
      width: 80,
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

const fields = {
  maintenancePrice: PriceMaintainceField,
  placingPrice: PricePlacingField,
  electricityPrice: PriceElectricityField,
  waterPrice: PriceWaterField,
  garbageCollectorPrice: PriceGarbageCollectorField,
  inflicionPrice: PriceInflicionField,
}

function AddCustomField({ addDataSource }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customFieldName, setCustomFieldName] = useState('')

  const addField = () => {
    addDataSource({
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

function PriceWrapper({ record, form, edit }) {
  const fieldName = [record.name, 'price']
  const options = getRelationshipByRecordName(record.name)
  const field = Form.useWatch(options?.fieldName, form)

  useEffect(() => {
    if (options?.fieldName && field) {
      // TODO: convert ObjectId into object with real value
      // field for now it is ObjectId, but should be real object with valueName 'rentPrice'
      // form.setFieldValue(fieldName, field[options?.valueName])
      form.setFieldValue(fieldName, options?.testValue)
    }
  }, [options?.fieldName, field]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      {<InputNumber disabled={edit} className={s.input} />}
    </Form.Item>
  )
}

function getRelationshipByRecordName(recordName) {
  return (
    {
      // ціна обслуговування за метр. береться із стандартної ціни послуг в місяць
      // ще треба подумати чи можна її легко взяти із компанії (рілестейт) індивідуальну ціну за обслуговування
      // servicePricePerMeter
      // також треба проінформувати юзера, що це індивідуальна ціна за метр, а не загальна
      maintenancePrice: {
        fieldName: 'monthService',
        valueName: 'rentPrice',
        // тестове значення повинно бути динамічне
        testValue: recordName,
      },
      // компанія та її ціна за метр розміщення (оренди) береться з компанії (рілестейт)
      placingPrice: {
        fieldName: 'company',
        valueName: 'pricePerMeter',
        // тестове значення повинно бути динамічне
        testValue: recordName,
      },
      // ціна електрики за кіловат. береться із стандартної ціни послуг в місяць
      electricityPrice: {
        fieldName: 'monthService',
        valueName: 'electricityPrice',
        // тестове значення повинно бути динамічне
        testValue: recordName,
      },
      // ціна води за куб. береться із стандартної ціни послуг в місяць
      waterPrice: {
        fieldName: 'monthService',
        valueName: 'waterPrice',
        // тестове значення повинно бути динамічне
        testValue: recordName,
      },
      garbageCollectorPrice: {
        fieldName: 'company',
        valueName: 'garbageCollectorPrice',
        testValue: recordName,
      },
      inflicionPrice: {
        fieldName: 'monthService',
        valueName: 'inflicionPrice',
        testValue: recordName,
      },
    }[recordName] || {}
  )
}

function SumWrapper({ record, form }) {
  // вся ця штука повинна бути також динамічна за прикладом компонента зверху.
  // ми повинні прописати умови прорахунку, за яким беруться значення
  // TODO: fix labels

  const formFields = Form.useWatch(record.name, form)

  // TODO: fix. such items should be "Clear function". Without side effect

  const getVal = (record, obj) => {
    switch (record) {
      case ServiceType.Maintenance: {
        const m = obj?.amount * obj?.price
        return +m.toFixed(1) || 0
      }
      case ServiceType.Placing: {
        const p = obj?.amount * obj?.price
        return +p.toFixed(1) || 0
      }
      case ServiceType.Electricity: {
        const e = (obj?.amount - obj?.lastAmount) * obj?.price
        return +e.toFixed(1) || 0
      }
      case ServiceType.Water: {
        const w = (obj?.amount - obj?.lastAmount) * obj?.price
        return +w.toFixed(1) || 0
      }
      default: {
        return +obj?.price || 0
      }
    }
  }
  form.setFieldValue([record.name, 'sum'], getVal(record?.name, formFields))
  return (
    <Form.Item name={[record?.name, 'sum']}>
      <h4 className={s.price}>{getVal(record?.name, formFields)} ₴</h4>
    </Form.Item>
  )
}

export default PaymentPricesTable
