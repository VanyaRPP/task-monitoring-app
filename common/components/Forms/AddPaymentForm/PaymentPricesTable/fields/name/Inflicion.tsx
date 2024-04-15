import { QuestionCircleOutlined } from '@ant-design/icons'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { inflicionDescription } from '@utils/constants'
import { getFormattedDate } from '@utils/helpers'
import { Tooltip } from 'antd'
import s from './style.module.scss'

const Inflicion: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service, prevPayment } = usePaymentContext()

  return (
    <div className={s.Cell}>
      Індекс інфляції
      {company?.inflicion && prevPayment?.monthService && (
        <Tooltip className={s.Tooltip} title={!preview && inflicionDescription}>
          <span className={s.Sub}>
            {/* eslint-disable-next-line */}
            {/* @ts-ignore */}
            {getFormattedDate(prevPayment.monthService.date)}{' '}
            {(service?.inflicionPrice || 100).toFixed(2)}%
          </span>
          {!preview && <QuestionCircleOutlined />}
        </Tooltip>
      )}
      {company?.inflicion && prevPayment?.monthService && (
        <span className={s.Sub}>
          {+service?.inflicionPrice < 100
            ? 'Спостерігається дефляція'
            : +service?.inflicionPrice > 100
            ? 'Донарахування'
            : 'Значення незмінне'}
        </span>
      )}
    </div>
  )
}

export default Inflicion
