import { Selector } from '@common/components/UI/Reusable/Selector'

export interface IStreetFilterSelectorOption {
  text?: string
  label?: string
  value: string
}

export interface IStreetFilterSelectorProps {
  filters: any // TODO: proper typing
  streetsFilter: IStreetFilterSelectorOption[]
  setFilters: (...args: any) => any
  style?: React.CSSProperties
  className?: string
}

const StreetFilterSelector: React.FC<IStreetFilterSelectorProps> = (props) => {
  return (
    <Selector
      style={props.style}
      className={props.className}
      placeholder="Оберіть адресу..."
      selected={
        props.filters?.street?.length === 1
          ? props.filters.street[0]
          : undefined
      }
      onSelect={(value) =>
        props.setFilters({ ...props.filters, street: [value] })
      }
      // Possible multiselect support
      // onSelect={(value) =>
      //   props.setFilters({
      //     ...props.filters,
      //     street: Array.isArray(props.filters?.street)
      //       ? [...props.filters.street, value]
      //       : [value],
      //   })
      // }
      // onDeselect={(value) =>
      //   props.setFilters({
      //     ...props.filters,
      //     street: props.filters?.street?.filter((street) => street !== value),
      //   })
      // }
      onClear={() => props.setFilters({ ...props.filters, street: undefined })}
      options={props.streetsFilter?.map((option) => ({
        // .label instead of .text (antd renders .value if .label is not presented)
        label: option.label || option.text || option.value,
        value: option.value,
      }))}
    />
  )
}

export default StreetFilterSelector
