import { Selector } from '@common/components/UI/Reusable/Selector'

export interface IDomainFilterSelectorOption {
  text?: string
  label?: string
  value: string
}

export interface IDomainFilterSelectorProps {
  filters: any // TODO: proper typing
  domainsFilter: IDomainFilterSelectorOption[]
  setFilters: (...args: any) => any
  style?: React.CSSProperties
  className?: string
}

const DomainFilterSelector: React.FC<IDomainFilterSelectorProps> = (props) => {
  return (
    <Selector
      style={props.style}
      className={props.className}
      placeholder="Оберіть надавача послуг..."
      selected={
        props.filters?.domain?.length === 1
          ? props.filters.domain[0]
          : undefined
      }
      onSelect={(value) =>
        props.setFilters({ ...props.filters, domain: [value] })
      }
      // Possible multiselect support
      // onSelect={(value) =>
      //   props.setFilters({
      //     ...props.filters,
      //     domain: Array.isArray(props.filters?.domain)
      //       ? [...props.filters.domain, value]
      //       : [value],
      //   })
      // }
      // onDeselect={(value) =>
      //   props.setFilters({
      //     ...props.filters,
      //     domain: props.filters?.domain?.filter((domain) => domain !== value),
      //   })
      // }
      onClear={() => props.setFilters({ ...props.filters, domain: undefined })}
      options={props.domainsFilter?.map((option) => ({
        // .label instead of .text (antd renders .value if .label is not presented)
        label: option.label || option.text || option.value,
        value: option.value,
      }))}
    />
  )
}

export default DomainFilterSelector
