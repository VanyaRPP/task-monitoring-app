import React from 'react'
import { Cascader } from 'antd'
import s from '@components/UI/PaymentCascader/styled.module.scss'
import {
  cascaderMonths,
  cascaderQuarters,
  cascaderYears,
} from '@utils/constants'

const PaymentCascader = ({ onChange }) => {
  return (
    <div className={s.PaymentCascader}>
      <Cascader
        placeholder="Оберіть проміжок"
        options={customOptions}
        onChange={onChange}
      />
    </div>
  )
}

const customOptions = [
  {
    label: 'Рік',
    value: 'year',
    children: cascaderYears.map((year) => {
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
