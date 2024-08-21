import { Form, Input, Select, Space } from 'antd'
import React, { FC } from 'react'
import s from '../style.module.scss'
import { validateField } from '@assets/features/validators'
const options = [
  {
    value: 'FOP',
    label: 'FOP',
  },
  {
    value: 'TOV',
    label: 'TOV',
  },
]

interface Props {
  editable: boolean
}

const DomainInfo: FC<Props> = ({ editable }) => {
  return (
    <div>
      <Form.Item name="IE" label="FOP" rules={validateField('required')}>
        <Space.Compact className={s.formInput}>
          <Select
            style={{ width: '20%' }}
            defaultValue="FOP"
            options={options}
            disabled={!editable}
          />
          <Input
            placeholder="Вкажіть ФОП"
            maxLength={256}
            className={s.formInput}
            disabled={!editable}
          />
        </Space.Compact>
      </Form.Item>
      {/* IBAN */}
      <Form.Item name="IBAN" label="IBAN" rules={validateField('IBAN')}>
        <Input
          placeholder="Вкажіть IBAN"
          maxLength={34}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="MFO" label="МФО" rules={validateField('required')}>
        <Input
          placeholder="Вкажіть МФО"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="description" label="Опис">
        <Input.TextArea
          placeholder="Вкажіть значення"
          className={s.formInput}
          maxLength={512}
          rows={4}
          disabled={!editable}
        />
      </Form.Item>

      <Form.Item name="PRIVATE_TOKEN" label="Private Token">
        <Input
          placeholder="Token"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
    </div>
  )
}

export default DomainInfo
