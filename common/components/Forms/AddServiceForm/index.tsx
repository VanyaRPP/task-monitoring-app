import React, { FC, useState } from 'react'
import { useGetAllUsersQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import s from './style.module.scss'
import type { DatePickerProps } from 'antd'
import { DatePicker, Space } from 'antd'
import { Tabs, TabsProps } from 'antd'
import Image from 'next/image'
import Preliminary_account from '../../../../public/Preliminary_account.png'
type TabPosition = 'left'

const onChange1: DatePickerProps['onChange'] = (date, dateString) => {
  console.warn(date, dateString)
}
const onChange2 = (key: string) => {
  console.log(key)
}

interface Props {
  form: FormInstance<any>
}

const AddServiceForm: FC<Props> = ({ form }) => {
  const { Option } = Select
  const { data: users } = useGetAllUsersQuery()
  const dayjs = require('dayjs')
  const [tabPosition] = useState<TabPosition>('left')

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: ` Рахунок`,
      children: (
        <Form form={form} layout="vertical" className={s.Form}>
          <Form.Item
            name="payer"
            label="Місяць та рік"
            rules={validateField('data')}
          >
            <Space direction="vertical">
              <DatePicker
                onChange={onChange1}
                defaultValue={dayjs}
                picker="month"
              />
            </Space>
          </Form.Item>
          <Form.Item
            name="orenda"
            label="Утримання приміщень"
            // rules={validateField('required')}
          >
            {' '}
            <InputNumber
              type="number"
              style={{ width: '32%' }}
              className={s.InputNumber}
            />
          </Form.Item>
          <Form.Item
            name="electricPrice"
            label="Електроенергія"
            // rules={validateField('electricPrice')}
          >
            {' '}
            <InputNumber
              type="number"
              style={{ width: '32%' }}
              className={s.InputNumber}
            />
          </Form.Item>
          <Form.Item
            name="waterPrice"
            label="Водопостачання"
            // rules={validateField('required')}
          >
            {' '}
            <InputNumber
              type="number"
              style={{ width: '32%' }}
              className={s.InputNumber}
            />
          </Form.Item>
          <Form.Item
            name="inflaPrice"
            label="Індекс інфляції"
            // rules={validateField('required')}
          >
            {' '}
            <InputNumber
              type="number"
              style={{ width: '32%' }}
              className={s.InputNumber}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Опис"
            // rules={validateField('required')}
          >
            <Input.TextArea
              placeholder="Введіть опис"
              style={{ width: '90%' }}
              maxLength={256}
            />
          </Form.Item>
        </Form>
      ),
    },
    {
      key: '2',
      label: ` Попередній рахунок`,
      children: <Image className="object-cover" src={Preliminary_account} />,
    },
  ]

  return (
    <>
      <Tabs
        tabPosition={tabPosition}
        defaultActiveKey="1"
        items={items}
        onChange={onChange2}
      />
    </>
  )
}

export default AddServiceForm
