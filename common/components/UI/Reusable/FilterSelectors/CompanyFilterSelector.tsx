import { Selector } from '@components/UI/Reusable/Selector'

export interface ICompanyFilterSelectorOption {
  text?: string
  label?: string
  value: string
}

export interface ICompanyFilterSelectorProps {
  filters: any // TODO: proper typing
  companiesFilter: ICompanyFilterSelectorOption[]
  setFilters: (...args: any) => any
  style?: React.CSSProperties
  className?: string
}

const CompanyFilterSelector: React.FC<ICompanyFilterSelectorProps> = (
  props
) => {
  return (
    <Selector
      style={props.style}
      className={props.className}
      placeholder="Оберіть компанію..."
      selected={
        props.filters?.company?.length === 1
          ? props.filters.company[0]
          : undefined
      }
      onSelect={(value) =>
        props.setFilters({ ...props.filters, company: [value] })
      }
      // Possible multiselect support
      // onSelect={(value) =>
      //   props.setFilters({
      //     ...props.filters,
      //     company: Array.isArray(props.filters?.company)
      //       ? [...props.filters.company, value]
      //       : [value],
      //   })
      // }
      // onDeselect={(value) =>
      //   props.setFilters({
      //     ...props.filters,
      //     company: props.filters?.company?.filter((company) => company !== value),
      //   })
      // }
      onClear={() => props.setFilters({ ...props.filters, company: undefined })}
      options={props.companiesFilter?.map((option) => ({
        // .label instead of .text (antd renders .value if .label is not presented)
        label: option.label || option.text || option.value,
        value: option.value,
      }))}
    />
  )
}

export default CompanyFilterSelector
