import { Table, Tooltip, InputNumber, Form, FormInstance } from 'antd'
import { FC, useEffect } from 'react'
import { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import { dataSource, IPaymentTableData } from '@utils/tableData'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { getName } from '@utils/helpers'
import { validateField } from '@common/assets/features/validators'
import s from './style.module.scss'
import { getFormattedDate } from '@common/components/DashboardPage/blocks/services'
import useService from '@common/modules/hooks/useService'
import {
  PriceElectricityField,
  PriceMaintainceField,
  PricePlacingField,
  PriceWaterField,
} from './fields/priceFields'
import useCompany from '@common/modules/hooks/useCompany'
import { AmountTotalAreaField } from './fields/amountFields'
interface Props {
  form: FormInstance<any>
  edit: boolean
  paymentData: any
}

const PaymentPricesTable: FC<Props> = ({ form, edit, paymentData }) => {
  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId = Form.useWatch('service', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, domainId, streetId })
  const { service } = useService({ serviceId, domainId, streetId })

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
      render: (name) => (
        // TODO: use moment from helper (single access point)
        // getFormattedDate
        <Tooltip
          title={`${getName(name, paymentsTitle)} (${(moment(service?.date).format("MMMM"))})`}
        >
          <span className={s.rowText}>
            {getName(name, paymentsTitle)}{' '}
            <span className={s.month}>({getFormattedDate(service?.date)})</span>
            {company?.servicePricePerMeter &&
              getName(name, paymentsTitle) === 'Утримання' && (
                <span className={s.month}> індивідуальне</span>
              )}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'К-сть',
      dataIndex: 'amount',
      width: '30%',
      render: (text, record) => (
        <>
          {/* TODO: Use enum for record type. there is no "electricity", but "electricityPrice" */}
          {record.name === ServiceType.Electricity ||
          record.name === ServiceType.Water ? (
            <div className={s.doubleInputs}>
              <Form.Item
                name={[record.name, 'lastAmount']}
                rules={validateField('required')}
                initialValue={
                  paymentData
                    ? paymentData.invoice.find(
                        (item) => item.type === record.name
                      ).lastAmount
                    : ''
                }
              >
                <InputNumber disabled={edit} className={s.input} />
              </Form.Item>

              <Form.Item
                name={[record.name, 'amount']}
                rules={validateField('required')}
                initialValue={
                  paymentData
                    ? paymentData.invoice.find(
                        (item) => item.type === record.name
                      ).amount
                    : ''
                }
              >
                <InputNumber disabled={edit} className={s.input} />
              </Form.Item>
            </div>
          ) : (
            <AmountTotalAreaField
              record={record}
              form={form}
              edit={edit}
              paymentData={paymentData}
            />
          )}
        </>
      ),
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      render: (text, record) => {
        const fields = {
          maintenancePrice: PriceMaintainceField,
          placingPrice: PricePlacingField,
          electricityPrice: PriceElectricityField,
          waterPrice: PriceWaterField,
        }
        if (record.name in fields) {
          const Component = fields[record.name]
          return (
            <Component
              record={record}
              form={form}
              edit={edit}
              paymentData={paymentData}
            />
          )
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

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      className={s.table}
    />
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
      <InputNumber disabled={edit} className={s.input} />
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
      case 'maintenancePrice': {
        const m = obj?.amount * obj?.price
        return +m.toFixed(1) || 0
      }
      case 'placingPrice': {
        const p = obj?.amount * obj?.price
        return +p.toFixed(1) || 0
      }
      case 'electricityPrice': {
        const e = (obj?.amount - obj?.lastAmount) * obj?.price
        return +e.toFixed(1) || 0
      }
      case 'waterPrice': {
        const w = (obj?.amount - obj?.lastAmount) * obj?.price
        return +w.toFixed(1) || 0
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
