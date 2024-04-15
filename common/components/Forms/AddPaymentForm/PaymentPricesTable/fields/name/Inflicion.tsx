import { QuestionCircleOutlined } from '@ant-design/icons'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { inflicionDescription } from '@utils/constants'
import { Tooltip } from 'antd'
import s from './style.module.scss'

const Inflicion: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  return (
    <div className={s.Cell}>
      {preview ? (
        <>Індекс інфляції {(service?.inflicionPrice || 0).toFixed(2)}%</>
      ) : (
        <Tooltip title={inflicionDescription}>
          Індекс інфляції {(service?.inflicionPrice || 0).toFixed(2)}%{' '}
          <QuestionCircleOutlined />
        </Tooltip>
      )}

      <span className={s.Sub}>
        {company?.inflicion &&
          (+service?.inflicionPrice < 100
            ? 'Спостерігається дефляція'
            : +service?.inflicionPrice > 100
            ? 'Донарахування'
            : 'Значення незмінне')}
      </span>
    </div>
  )
}

export default Inflicion
