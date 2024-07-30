import React from 'react'
import s from '@components/UI/PaymentSelect/styled.module.scss'
import { Operations } from '@utils/constants'
import { Select } from 'antd'

const SelectForDebitAndCredit = ({ onChange }) => {
  return (
    <div className={s.PaymentSelect}>
      <Select
        options={customOptions}
        onChange={onChange}
        allowClear
        placeholder="Виберіть тип"
      />
    </div>
  )
}

const customOptions = [
  {
    label: 'Дебет',
    value: Operations.Debit,
  },
  {
    label: 'Кредит',
    value: Operations.Credit,
  },
]

export default SelectForDebitAndCredit
