import { usePaymentContext } from '@components/AddPaymentModal'
import { EditInvoicesTable_unstable } from '@components/Tables/EditInvoiceTable'
import { useEffect, useState } from 'react'
import { Popconfirm, Button, Input, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'


export interface PaymentPricesTableProps {
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
  const { form, service } = usePaymentContext()
  const invoices = form.getFieldValue('invoice')
  const [customName, setCustomName] = useState('')
  const [isPopOpen, setIsPopOpen] = useState(false)

  const handleAddCustomService = () => {
    const currentInvoice = form.getFieldValue('invoice') || []

    const newInvoiceItem = {
      name: customName,
      amount: 1,
      price: 0,
      sum: 0,
      type: 'custom',
    }

    form.setFieldsValue({
      invoice: [...currentInvoice, newInvoiceItem],
    })

    setCustomName('')
    setIsPopOpen(false)
    message.success('Кастомна послуга додана')
  }

  useEffect(() => {
    const filteredInvoices = invoices?.filter(
      (invoice) =>
        invoice?.sum > 0 ||
        ['discount', 'maintenancePrice', 'garbageCollectorPrice'].includes(
          invoice?.type
        )
    )

    form.setFieldsValue({
      invoice: filteredInvoices,
    })
  }, [])

return (
  <>
    {!preview && (
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
        <Popconfirm
          title={
            <Space direction="vertical" style={{ display: 'flex' }}>
              <Input
                placeholder="Назва послуги"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
            </Space>
          }
          open={isPopOpen}
          onOpenChange={setIsPopOpen}
          onConfirm={handleAddCustomService}
          onCancel={() => setIsPopOpen(false)}
          okText="Підтвердити"
          cancelText="Скасувати"
        >
          <Button type="dashed" icon={<PlusOutlined />}>
            Додати кастомну послугу
          </Button>
        </Popconfirm>
      </div>
    )}

    <EditInvoicesTable_unstable
      form={form}
      editable={!preview}
      loading={loading}
    />
  </>
)

  /**
   * @deprecated
   */
  // return (
  //   <Form.List name={'invoice'}>
  //     {(fields, { add, remove }) => (
  //       <Table
  //         rowKey="name"
  //         loading={loading}
  //         dataSource={fields}
  //         pagination={false}
  //         footer={() =>
  //           !preview && (
  //             <Button
  //               type="dashed"
  //               onClick={() =>
  //                 add({
  //                   type: ServiceType.Custom,
  //                   price: 0,
  //                 })
  //               }
  //               block
  //               icon={<PlusOutlined />}
  //             >
  //               Додати поле
  //             </Button>
  //           )
  //         }
  //       >
  //         <Table.Column
  //           title={'№'}
  //           width={50}
  //           render={(_, __, index) => <>{index + 1}</>}
  //         />
  //         <Table.Column
  //           title={'Назва'}
  //           dataIndex={'name'}
  //           width={'27.5%'}
  //           render={(_, record: { name: number }) => (
  //             <Form.Item noStyle shouldUpdate>
  //               {({ getFieldValue }) => (
  //                 <NameComponent
  //                   record={{
  //                     ...getFieldValue(['invoice', record.name]),
  //                     key: record.name,
  //                   }}
  //                   preview={preview}
  //                 />
  //               )}
  //             </Form.Item>
  //           )}
  //         />
  //         <Table.Column
  //           title={'Кількість'}
  //           dataIndex={'amount'}
  //           render={(_, record: { name: number }) => (
  //             <Form.Item noStyle shouldUpdate>
  //               {({ getFieldValue }) => (
  //                 <AmountComponent
  //                   record={{
  //                     ...getFieldValue(['invoice', record.name]),
  //                     key: record.name,
  //                   }}
  //                   preview={preview}
  //                 />
  //               )}
  //             </Form.Item>
  //           )}
  //         />
  //         <Table.Column
  //           title={'Ціна'}
  //           dataIndex={'price'}
  //           render={(_, record: { name: number }) => (
  //             <Form.Item noStyle shouldUpdate>
  //               {({ getFieldValue }) => (
  //                 <PriceComponent
  //                   record={{
  //                     ...getFieldValue(['invoice', record.name]),
  //                     key: record.name,
  //                   }}
  //                   preview={preview}
  //                 />
  //               )}
  //             </Form.Item>
  //           )}
  //         />
  //         <Table.Column
  //           title={'Сума'}
  //           width={120}
  //           render={(_, record: { name: number }) => (
  //             <Form.Item noStyle shouldUpdate>
  //               {({ getFieldValue }) => (
  //                 <div style={{ fontWeight: 600 }}>
  //                   <SumComponent
  //                     record={{
  //                       ...getFieldValue(['invoice', record.name]),
  //                       key: record.name,
  //                     }}
  //                   />
  //                 </div>
  //               )}
  //             </Form.Item>
  //           )}
  //         />
  //         {!preview && (
  //           <Table.Column
  //             width={50}
  //             render={(_, record: { name: number }) => (
  //               <MinusCircleOutlined onClick={() => remove(record.name)} />
  //             )}
  //           />
  //         )}
  //       </Table>
  //     )}
  //   </Form.List>
  // )
}

export default PaymentPricesTable
