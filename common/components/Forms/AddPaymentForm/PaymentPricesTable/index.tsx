import { Table, Tooltip, InputNumber, Form, FormInstance } from 'antd'
import { FC, useEffect } from 'react'
import { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import { dataSource, IPaymentTableData } from '@utils/tableData'
import { paymentsTitle } from '@utils/constants'
import { getName } from '@utils/helpers'
import { validateField } from '@common/assets/features/validators'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  edit: boolean
  paymentData: any
}

const PaymentPricesTable: FC<Props> = ({ form, edit, paymentData }) => {
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
          title={`${getName(name, paymentsTitle)} (${moment().format('MMMM')})`}
        >
          <span className={s.rowText}>
            {getName(name, paymentsTitle)}{' '}
            <span className={s.month}>({moment().format('MMMM')})</span>
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
          {record.name === 'electricity' || record.name === 'water' ? (
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
            <Form.Item
              name={[record.name, 'amount']}
              rules={validateField('required')}
            >
              <InputNumber disabled={edit} className={s.input} />
            </Form.Item>
          )}
        </>
      ),
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      render: (text, record) => (
        <PriceWrapper record={record} form={form} edit={edit} />
      ),
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
      maintenance: {
        fieldName: 'monthService',
        valueName: 'rentPrice',
        // тестове значення повинно бути динамічне
        testValue: 123,
      },
      // компанія та її ціна за метр розміщення (оренди) береться з компанії (рілестейт)
      placing: {
        fieldName: 'company',
        valueName: 'pricePerMeter',
        // тестове значення повинно бути динамічне
        testValue: 345,
      },
      // ціна електрики за кіловат. береться із стандартної ціни послуг в місяць
      electricity: {
        fieldName: 'monthService',
        valueName: 'electricityPrice',
        // тестове значення повинно бути динамічне
        testValue: 567,
      },
      // ціна води за куб. береться із стандартної ціни послуг в місяць
      water: {
        fieldName: 'monthService',
        valueName: 'waterPrice',
        // тестове значення повинно бути динамічне
        testValue: 689,
      },
    }[recordName] || {}
  )
}

function SumWrapper({ record, form }) {
  // вся ця штука повинна бути також динамічна за прикладом компонента зверху.
  // ми повинні прописати умови прорахунку, за яким беруться значення
  // TODO: fix labels
  const maintenance = Form.useWatch('maintenance', form)
  const placing = Form.useWatch('placing', form)
  const electricity = Form.useWatch('electricity', form)
  const water = Form.useWatch('water', form)

  // TODO: fix. such items should be "Clear function". Without side effect
  const getVal = (record) => {
    switch (record) {
      case 'maintenance': {
        const m = maintenance?.amount * maintenance?.price
        return +m.toFixed(1) || 0
      }
      case 'placing': {
        const p = placing?.amount * placing?.price
        return +p.toFixed(1) || 0
      }
      case 'electricity': {
        const e =
          (electricity?.amount - electricity?.lastAmount) * electricity?.price
        return +e.toFixed(1) || 0
      }
      case 'water': {
        const w = (water?.amount - water?.lastAmount) * water?.price
        return +w.toFixed(1) || 0
      }
    }
  }
  return (
    <Form.Item name={[record?.name, 'sum']}>
      <h4 className={s.price}>{getVal(record?.name)} ₴</h4>
    </Form.Item>
  )
}

export default PaymentPricesTable
