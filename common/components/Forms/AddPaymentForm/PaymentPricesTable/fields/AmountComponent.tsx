import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { ServiceType } from '@utils/constants'
import { Form, Input, Tooltip } from 'antd'

export const AmountComponent: React.FC<{
  record: Invoice
  edit?: boolean
}> = ({ record, edit }) => {
  switch (record?.type) {
    case ServiceType.Custom:
      return <Cleaning record={record} edit={edit} />
    case ServiceType.Cleaning:
      return <Cleaning record={record} edit={edit} />
    case ServiceType.Electricity:
      return <Electricity record={record} edit={edit} />
    case ServiceType.Discount:
      return <Discount record={record} edit={edit} />
    case ServiceType.GarbageCollector:
      return <GarbageCollector record={record} edit={edit} />
    case ServiceType.Inflicion:
      return <Inflicion record={record} edit={edit} />
    case ServiceType.Maintenance:
      return <Maintenance record={record} edit={edit} />
    case ServiceType.Placing:
      return <Placing record={record} edit={edit} />
    case ServiceType.Water:
      return <Water record={record} edit={edit} />
    case ServiceType.WaterPart:
      return <WaterPart record={record} edit={edit} />
    default:
      return <Unknown record={record} />
  }
}

const Unknown: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Unknown</>
}

const Cleaning: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return null
}

const Electricity: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Amount record={record} edit={edit} last />
      <Amount record={record} edit={edit} />
    </div>
  )
}

const Discount: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return null
}

const GarbageCollector: React.FC<{
  record: Invoice
  edit?: boolean
}> = ({ record, edit }) => {
  return <Amount record={record} edit={edit} />
}

const Inflicion: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { paymentData } = usePaymentContext()

  if (!record?.company?.inflicion) {
    return null
  }

  const prevPlacing = 2800
  const inflicion: number =
    (paymentData as IPayment)?.invoice.find(
      (invoice) => invoice.type === ServiceType.Inflicion
    ).sum - 100

  return (
    <>
      {inflicion.toFixed(2)}% від {prevPlacing.toFixed(2)}
    </>
  )
}

const Maintenance: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return <Amount record={record} edit={edit} />
}

const Placing: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { form } = usePaymentContext()
  const inflicionPrice = Form.useWatch(
    ['invoice', ServiceType.Inflicion, 'price'],
    form
  )

  if (record?.company?.inflicion) {
    return (
      <div>
        <p>
          {(Number(record?.prevService?.rentPrice) || 0).toFixed(2)} +{' '}
          {(Number(inflicionPrice) || 0).toFixed(2)}
        </p>
        <Tooltip
          title={`Значення попереднього місяця + індекс інфляції в цьому рахунку`}
        />
      </div>
    )
  }

  return <Amount record={record} edit={edit} />
}

const Water: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Amount record={record} edit={edit} last />
      <Amount record={record} edit={edit} />
    </div>
  )
}

const WaterPart: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return <Amount record={record} edit={edit} />
}

const Amount: React.FC<{
  record: Invoice
  edit?: boolean
  last?: Boolean
}> = ({ record, edit, last }) => {
  const amount = !last ? 'amount' : 'lastAmount'
  const name = ['invoice', record.type, amount]
  const { form } = usePaymentContext()
  const value = Form.useWatch(name, form)

  return (
    <Form.Item
      name={name}
      initialValue={
        !record[amount] || isNaN(record[amount]) ? 0 : Number(record[amount])
      }
      style={{ flex: 1 }}
      // check for possible UI BUG: `edit: false` and initial value is `undefined | null`
      rules={[{ required: true, message: 'Required' }]}
    >
      {edit ? (
        <Input type="number" />
      ) : (
        (!value || isNaN(value) ? 0 : Number(value)).toFixed(2)
      )}
    </Form.Item>
  )
}
