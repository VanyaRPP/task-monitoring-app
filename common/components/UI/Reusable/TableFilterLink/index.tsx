import { Tooltip, Typography } from 'antd'
import { useIsTruncated } from '@common/hooks/useIsTruncated'
import styles from './style.module.scss'

interface TableFilterLinkProps {
  label: string
  filterKey: string
  filterId: string
  filters: Record<string, any> | undefined
  setFilters: (filters: Record<string, any> | undefined) => void
  tooltipTitle?: string
  /**
   * Some callers render this inside an auto-sizing wrapper (e.g. antd
   * `Badge`), which has no width of its own to cap `max-width: 100%`
   * against — pass an explicit pixel width there so truncation still works.
   */
  maxWidth?: number | string
}

const TableFilterLink: React.FC<TableFilterLinkProps> = ({
  label,
  filterKey,
  filterId,
  filters,
  setFilters,
  tooltipTitle = 'Додати в фільтри',
  maxWidth,
}) => {
  const [ref, isTruncated] = useIsTruncated<HTMLElement>([label])

  const title = isTruncated ? (
    <>
      {label}
      {tooltipTitle && <br />}
      {tooltipTitle}
    </>
  ) : (
    tooltipTitle
  )

  return (
    <Tooltip title={title}>
      <Typography.Link
        ref={ref as any}
        className={styles.TableFilterLink}
        style={maxWidth != null ? { maxWidth } : undefined}
        onClick={() => setFilters({ ...filters, [filterKey]: [filterId] })}
      >
        {label}
      </Typography.Link>
    </Tooltip>
  )
}

export default TableFilterLink
