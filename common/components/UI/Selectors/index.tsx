import { SelectProps } from 'antd'

export type SelectorProps = Omit<
  SelectProps,
  | 'placeholder'
  | 'loading'
  | 'showSearch'
  | 'allowClear'
  | 'optionFilterProp'
  | 'options'
>
