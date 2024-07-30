import { QuestionCircleOutlined } from '@ant-design/icons'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { maintenanceWithoutInflicionDescription } from '@utils/constants'
import { getFormattedDate } from '@utils/helpers'
import { Tooltip } from 'antd'
import s from './style.module.scss'

const Placing: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  return (
    <div className={s.Cell}>
      Розміщення
      <span className={s.Sub}>{getFormattedDate(service?.date)}</span>
      {company?.inflicion && (
        <Tooltip
          className={s.Tooltip}
          title={!preview && maintenanceWithoutInflicionDescription}
        >
          <span className={s.Sub}>Без врахування індексу інфляції</span>
          {!preview && <QuestionCircleOutlined />}
        </Tooltip>
      )}
    </div>
  )
}

export default Placing
