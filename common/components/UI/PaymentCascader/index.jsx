import React from 'react'
import { Cascader } from 'antd'

const PaymentCascader = ({ onChange }) => {
  return (
    <Cascader
      placeholder="Оберіть проміжок"
      options={customOptions}
      onChange={onChange}
    />
  )
}

const customOptions = [
  {
    label: 'Рік',
    value: 'year',
    children: [
      {
        label: `2023`,
        value: '2023',
        children: [
          {
            label: 'Увесь рік',
            value: 'year',
          },
          {
            label: 'Місяць',
            value: 'month',
            children: [
              {
                label: 'Січень',
                value: '1',
              },
              {
                label: 'Лютий',
                value: '2',
              },
              {
                label: 'Березень',
                value: '3',
              },
              {
                label: 'Квітень',
                value: '4',
              },
              {
                label: 'Травень',
                value: '5',
              },
              {
                label: 'Червень',
                value: '6',
              },
              {
                label: 'Липень',
                value: '7',
              },
              {
                label: 'Серпень',
                value: '8',
              },
              {
                label: 'Вересень',
                value: '9',
              },
              {
                label: 'Жовтень',
                value: '10',
              },
              {
                label: 'Листопад',
                value: '11',
              },
              {
                label: 'Грудень',
                value: '12',
              },
            ],
          },
          {
            label: 'Квартал',
            value: 'quarter',
            children: [
              {
                label: ` І квартал`,
                value: '1',
              },
              {
                label: `ІІ квартал`,
                value: '2',
              },
              {
                label: `III квартал`,
                value: '3',
              },
              {
                label: `IV квартал`,
                value: '4',
              },
            ],
          },
        ],
      },
    ],
  },
]

export default PaymentCascader
