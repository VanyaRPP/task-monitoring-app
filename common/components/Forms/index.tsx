import { Loading } from '@common/components/UI/Loading'
import { Form, FormInstance, FormItemProps, FormProps } from 'antd'

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

export interface EditFormAttributeProps {
  form: FormInstance<any>
  loading?: boolean
  editable?: boolean
  disabled?: boolean
}

export interface EditFormItemProps extends FormItemProps {
  loading?: boolean
}

export const EditFormItem: React.FC<EditFormItemProps> = ({
  loading,
  children,
  required,
  label,
  style,
  className,
  noStyle,
  ...props
}) => {
  return (
    <Form.Item
      style={{ ...style, ...(noStyle && { margin: 0 }) }}
      className={className}
      label={label}
      required={required}
    >
      <Loading loading={loading}>
        <Form.Item {...props} noStyle>
          {children}
        </Form.Item>
      </Loading>
    </Form.Item>
  )
}
