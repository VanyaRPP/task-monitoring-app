import { Form, Select } from 'antd'
import { FC } from 'react'
import s from '../style.module.scss'

const TEMPLATE_OPTIONS = [
  { value: 'classic', label: 'Класичний шаблон' },
  { value: 'olimp', label: 'OLIMP DIGITAL OÜ' },
  { value: 'ledger', label: 'Formal Ledger' },
  { value: 'official', label: 'Official Invoice' },
]

interface Props {
  editable: boolean
}

const TemplateTab: FC<Props> = ({ editable }) => (
  <Form.Item
    name="defaultTemplate"
    label="Шаблон за замовчуванням для рахунків"
    className={s.templateItem}
  >
    <Select
      options={TEMPLATE_OPTIONS}
      placeholder="Класичний шаблон"
      disabled={!editable}
      allowClear
    />
  </Form.Item>
)

export default TemplateTab
