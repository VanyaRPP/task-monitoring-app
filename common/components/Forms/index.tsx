import { FormInstance, FormProps } from 'antd'

export interface EditFormProps<T>
  extends Omit<
    FormProps,
    | 'children'
    | 'layout'
    | 'onFinish'
    | 'onFinishFailed'
    | 'initialValues'
    | 'requiredMark'
  > {
  onFinishFailed?: (error: any) => void
  onFinish?: (item: T) => void
  editable?: boolean
}

export interface EditFormItemProps {
  form: FormInstance<any>
  loading?: boolean
  editable?: boolean
  disabled?: boolean
}
