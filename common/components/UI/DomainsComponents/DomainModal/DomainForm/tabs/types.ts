import type { FormInstance } from 'antd'

export interface TabProps {
  form: FormInstance<any>
  editable: boolean
  domainId?: string
  setIsValueChanged: (value: boolean) => void
}
