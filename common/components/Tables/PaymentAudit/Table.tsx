import { useMemo, useState } from 'react'
import { Alert, Button, Flex, Table, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import {
  AuditFilters,
  IPaymentChangeLog,
  PaymentActionType,
  PaymentMutationSource,
} from '@common/api/paymentApi/payment.api.types'
import { useGetPaymentAuditQuery } from '@common/api/paymentApi/payment.api'
import usePaymentAuditColumns from './usePaymentAuditColumns'
import AuditDetailsModal from './AuditDetailsModal'

const DEFAULT_LIMIT = 20

type TableFilters = Record<string, FilterValue | null>

const keysToDateRange = (
  keys?: FilterValue | null
): { from?: string; to?: string } => {
  if (!keys || keys.length < 2) return {}
  return { from: String(keys[0]), to: String(keys[1]) }
}

const PaymentAuditTable: React.FC = () => {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [filters, setFilters] = useState<TableFilters>({})
  const [activeRecord, setActiveRecord] = useState<IPaymentChangeLog | null>(
    null
  )
  const [detailsOpen, setDetailsOpen] = useState(false)

  const queryArgs = useMemo<AuditFilters>(() => {
    const { from, to } = keysToDateRange(filters.date)
    return {
      page,
      limit,
      actorEmail: (filters.actorEmail?.[0] as string) || undefined,
      actionType: (filters.actionType as PaymentActionType[]) || undefined,
      source: (filters.source as PaymentMutationSource[]) || undefined,
      from,
      to,
    }
  }, [page, limit, filters])

  const { data, isFetching, isError, refetch } =
    useGetPaymentAuditQuery(queryArgs)

  const openDetails = (record: IPaymentChangeLog) => {
    setActiveRecord(record)
    setDetailsOpen(true)
  }

  const columns = usePaymentAuditColumns({ filters, onOpenDetails: openDetails })

  const handleChange = (
    pagination: TablePaginationConfig,
    nextFilters: TableFilters,
    _sorter: SorterResult<IPaymentChangeLog> | SorterResult<IPaymentChangeLog>[],
    extra: { action: 'paginate' | 'sort' | 'filter' }
  ) => {
    if (extra.action === 'filter') {
      setFilters(nextFilters)
      setPage(1)
    } else if (extra.action === 'paginate') {
      setPage(pagination.current ?? 1)
      setLimit(pagination.pageSize ?? DEFAULT_LIMIT)
    }
  }

  if (isError) {
    return (
      <Alert
        message="Не вдалося завантажити журнал аудиту"
        type="error"
        showIcon
      />
    )
  }

  return (
    <>
      <Flex justify="flex-end" style={{ marginBottom: 12 }}>
        <Tooltip title="Оновити журнал">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Оновити
          </Button>
        </Tooltip>
      </Flex>
      <Table<IPaymentChangeLog>
        rowKey="_id"
        size="small"
        loading={isFetching}
        columns={columns}
        dataSource={data?.data ?? []}
        onChange={handleChange}
        scroll={{ x: 1260 }}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Усього: ${total}`,
        }}
      />
      <AuditDetailsModal
        open={detailsOpen}
        record={activeRecord}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  )
}

export default PaymentAuditTable
