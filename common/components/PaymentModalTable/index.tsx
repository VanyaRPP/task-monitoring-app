import { Table, Tooltip, InputNumber, Form, FormInstance, Input } from 'antd'
import { FC, useEffect } from 'react'
import { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import { dataSource, IPaymentTableData } from '@utils/tableData'
import { paymentsTitle } from '@utils/constants'
import { getCurrentMonthService, getName } from '@utils/helpers'
import { validateField } from '@common/assets/features/validators'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  edit: boolean
  paymentData: any
}

const PaymentModalTable: FC<Props> = ({ form, edit, paymentData }) => {
  const { setFieldValue } = form
  const {
    data: payments,
    isFetching: paymentsFetching,
    isLoading: paymentsLoading,
  } = useGetAllPaymentsQuery({ limit: 100 })
  const {
    data: services,
    isFetching: servicesFetching,
    isLoading: servicesLoading,
  } = useGetAllServicesQuery({ limit: 12 })

  const payer = Form.useWatch('payer', form)
  const maintenance = Form.useWatch('maintenance', form)
  const m = maintenance?.amount * maintenance?.price

  const placing = Form.useWatch('placing', form)
  const p = placing?.amount * placing?.price

  const electricity = Form.useWatch('electricity', form)
  const e = (electricity?.amount - electricity?.lastAmount) * electricity?.price

  const water = Form.useWatch('water', form)
  const w = (water?.amount - water?.lastAmount) * water?.price

  const getVal = (record) => {
    switch (record) {
      case 'maintenance': {
        setFieldValue(['maintenance', 'sum'], m)
        return +m.toFixed(1) || 0
      }
      case 'placing': {
        setFieldValue(['placing', 'sum'], p)
        return +p.toFixed(1) || 0
      }
      case 'electricity': {
        setFieldValue(['electricity', 'sum'], e)
        return +e.toFixed(1) || 0
      }
      case 'water': {
        setFieldValue(['water', 'sum'], w)
        return +w.toFixed(1) || 0
      }
    }
  }
  const setFormDefaultValues = () => {
    const payment = payments?.find((p) => {
      return p?.payer?._id === payer && p?.debit > 0
    })
    const monthServices = getCurrentMonthService(services)

    setFieldValue(['electricity', 'lastAmount'], payment?.electricity?.amount)
    setFieldValue(['water', 'lastAmount'], payment?.water?.amount)
    setFieldValue(['maintenance', 'price'], monthServices?.orenda)
    setFieldValue(['electricity', 'price'], monthServices?.electricPrice)
    setFieldValue(['water', 'price'], monthServices?.waterPrice)
    setFieldValue(['maintenance', 'amount'], payment?.maintenance?.amount)
    setFieldValue(['placing', 'amount'], payment?.placing?.amount)
  }

  useEffect(() => {
    setFormDefaultValues()
  }, [payer, payments, services])

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
          {record.name === 'electricity' || record.name === 'water' ? (
            <div className={s.doubleInputs}>
              <Form.Item
                name={[record.name, 'lastAmount']}
                rules={validateField('required')}
              >
                <InputNumber
                  disabled={edit ? true : false}
                  className={s.input}
                />
              </Form.Item>

              <Form.Item
                name={[record.name, 'amount']}
                rules={validateField('required')}
              >
                <InputNumber
                  disabled={edit ? true : false}
                  className={s.input}
                />
              </Form.Item>
            </div>
          ) : (
            <Form.Item
              name={[record.name, 'amount']}
              rules={validateField('required')}
            >
              <InputNumber disabled={edit ? true : false} className={s.input} />
            </Form.Item>
          )}
        </>
      ),
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      render: (text, record) => (
        <Tooltip title={text}>
          <Form.Item
            name={[record.name, 'price']}
            rules={validateField('required')}
          >
            <InputNumber disabled={edit ? true : false} className={s.input} />
          </Form.Item>
        </Tooltip>
      ),
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      ellipsis: true,
      render: (text, record) => (
        <Form.Item name={[record?.name, 'sum']}>
          <h4 className={s.price}>{getVal(record?.name)} ₴</h4>
        </Form.Item>
      ),
      width: 80,
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      loading={
        paymentsLoading ||
        paymentsLoading ||
        servicesLoading ||
        servicesFetching
      }
      className={s.table}
    />
  )
}

export default PaymentModalTable
