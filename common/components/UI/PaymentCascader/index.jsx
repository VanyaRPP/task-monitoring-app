import s from '@components/UI/PaymentCascader/styled.module.scss'
import {
  cascaderMonths,
  cascaderQuarters,
  cascaderYears,
} from '@utils/constants'
import { Cascader } from 'antd'
import clsx from 'clsx'

const PaymentCascader = ({ onChange, className }) => {
  return (
    <div className={clsx(s.PaymentCascader, className)}>
      <Cascader
        placeholder="Оберіть проміжок"
        options={customOptions}
        onChange={onChange}
        className={className}
      />
    </div>
  )
}
const customOptions = [
  {
    label: 'Рік',
    value: 'year',
    children: [...cascaderYears].reverse().map((year) => {
      return {
        label: year,
        value: year,
        children: [
          {
            label: 'Увесь рік',
            value: 'year',
          },
          {
            label: 'Місяць',
            value: 'month',
            children: cascaderMonths,
          },
          {
            label: 'Квартал',
            value: 'quarter',
            children: cascaderQuarters,
          },
        ],
      }
    }),
  },
]

export default PaymentCascader
