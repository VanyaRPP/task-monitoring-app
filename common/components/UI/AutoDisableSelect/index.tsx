import { Select } from 'antd'
import { DefaultOptionType } from 'antd/lib/select'

export interface Props extends React.HTMLProps<HTMLDivElement> {
  placeholder?: string
  options?: DefaultOptionType[]
  value?: any
  onSelect?: (value) => void
}

export const AutoDisableSelect: React.FC<Props> = (props) => {
  return (
    <Select
      style={{ minWidth: 200 }}
      className={props.className}
      placeholder={props.placeholder}
      disabled={props.options?.length <= 1}
      options={props.options}
      value={props.value}
      onSelect={props.onSelect}
    />
  )
}
