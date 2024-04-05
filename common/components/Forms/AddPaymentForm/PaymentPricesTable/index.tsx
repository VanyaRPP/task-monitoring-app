import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { AmountComponent } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/fields/AmountComponent'
import { NameComponent } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/fields/NameComponent'
import { PriceComponent } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/fields/PriceComponent'
import { SumComponent } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/fields/SumComponent'
import { ServiceType } from '@utils/constants'
import { Button, Form, Table } from 'antd'
import React from 'react'

export interface Invoice {
  key?: string
  name?: string
  type: ServiceType
  lastAmount?: number
  amount?: number
  price: number
  sum?: number
}

export interface PaymentPricesTableProps {
  edit?: boolean
  preview?: boolean
  loading?: boolean
}

/**
 * @param preview describes that table is in PREVIEW mode
 * @param loading describes that table is loading
 */
const PaymentPricesTable: React.FC<PaymentPricesTableProps> = ({
  preview,
  loading,
}) => {
  return (
    <Form.List name={'invoice'}>
      {(fields, { add, remove }) => (
        <Table
          rowKey="name"
          loading={loading}
          dataSource={fields}
          pagination={false}
          footer={() =>
            !preview && (
              <Button
                type="dashed"
                onClick={() =>
                  add({
                    type: ServiceType.Custom,
                    price: 0,
                  })
                }
                block
                icon={<PlusOutlined />}
              >
                Додати поле
              </Button>
            )
          }
        >
          <Table.Column
            title={'№'}
            width={50}
            render={(_, __, index) => <>{index + 1}</>}
          />
          <Table.Column
            title={'Назва'}
            dataIndex={'name'}
            width={'27.5%'}
            render={(_, record: { name: number }) => (
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  <NameComponent
                    record={{
                      ...getFieldValue(['invoice', record.name]),
                      key: record.name,
                    }}
                    preview={preview}
                  />
                )}
              </Form.Item>
            )}
          />
          <Table.Column
            title={'Кількість'}
            dataIndex={'amount'}
            render={(_, record: { name: number }) => (
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  <AmountComponent
                    record={{
                      ...getFieldValue(['invoice', record.name]),
                      key: record.name,
                    }}
                    preview={preview}
                  />
                )}
              </Form.Item>
            )}
          />
          <Table.Column
            title={'Ціна'}
            dataIndex={'price'}
            render={(_, record: { name: number }) => (
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  <PriceComponent
                    record={{
                      ...getFieldValue(['invoice', record.name]),
                      key: record.name,
                    }}
                    preview={preview}
                  />
                )}
              </Form.Item>
            )}
          />
          <Table.Column
            title={'Сума'}
            width={120}
            render={(_, record: { name: number }) => (
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  <div style={{ fontWeight: 600 }}>
                    <SumComponent
                      record={{
                        ...getFieldValue(['invoice', record.name]),
                        key: record.name,
                      }}
                    />
                  </div>
                )}
              </Form.Item>
            )}
          />
          {!preview && (
            <Table.Column
              width={50}
              render={(_, record: { name: number }) => (
                <MinusCircleOutlined onClick={() => remove(record.name)} />
              )}
            />
          )}
        </Table>
      )}
    </Form.List>
  )
}

export default PaymentPricesTable
