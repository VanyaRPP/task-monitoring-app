import { QuestionCircleOutlined } from '@ant-design/icons'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Form, Tooltip } from 'antd'
import { Invoice } from '../..'
import { Amount } from '../../fields/amount'

const Placing: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { form, company, prevPayment } = usePaymentContext()

  const inflicionName = ['invoice', ServiceType.Inflicion, 'price']
  const inflicionPrice = Form.useWatch(inflicionName, form)

  if (company?.inflicion) {
    const prevPlacing =
      prevPayment?.invoice?.find(
        (invoice) => invoice.type === ServiceType.Placing
      )?.sum || 0
    const inflicion = inflicionPrice || 0

    return (
      <Tooltip
        title={`Значення попереднього місяця + індекс інфляції в цьому рахунку`}
      >
        {(+prevPlacing).toFixed(2)} + {(+inflicion).toFixed(2)}{' '}
        <QuestionCircleOutlined />
      </Tooltip>
    )
  }

  return <Amount record={record} edit={edit} />
}

export default Placing
