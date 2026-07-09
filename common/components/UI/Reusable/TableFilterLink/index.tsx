import { Tooltip, Typography } from 'antd'

interface TableFilterLinkProps {
  label: string
  filterKey: string
  filterId: string
  filters: Record<string, any> | undefined
  setFilters: (filters: Record<string, any> | undefined) => void
  tooltipTitle?: string
}

const TableFilterLink: React.FC<TableFilterLinkProps> = ({
  label,
  filterKey,
  filterId,
  filters,
  setFilters,
  tooltipTitle = 'Додати в фільтри',
}) => (
  <Tooltip title={tooltipTitle}>
    <Typography.Link
      onClick={() => setFilters({ ...filters, [filterKey]: [filterId] })}
    >
      {label}
    </Typography.Link>
  </Tooltip>
)

export default TableFilterLink
