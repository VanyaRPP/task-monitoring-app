import { DeleteFilled, EditFilled, EyeFilled } from '@ant-design/icons'
import {
  useDeleteStreetMutation,
  useGetStreetsQuery,
} from '@common/api/streetApi/street.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { TableProps } from '@common/components/Tables'
import { EditStreetButton } from '@common/components/UI/Buttons/EditStreetButton'
import { IStreet } from '@common/modules/models/Street'
import { Roles } from '@utils/constants'
import { Button, Popconfirm, Table, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface StreetsTableProps extends TableProps {
  domain?: string
}

export const StreetsTable: React.FC<StreetsTableProps> = ({
  domain: domainId,
  selected: _selected = [],
  onSelect,
  onDelete,
  editable = false,
  ...props
}) => {
  const { data: user } = useGetCurrentUserQuery()

  const isGlobalAdmin = useMemo(
    () => user?.roles?.includes(Roles.GLOBAL_ADMIN),
    [user]
  )

  const [selected, setSelected] = useState<string[]>(_selected)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(editable ? 10 : 5)
  const [filter, setFilter] = useState<Record<string, any>>({})

  const { data: streets, isLoading: isStreetsLoading } = useGetStreetsQuery({
    domainId,
    ...filter,
    limit: pageSize,
    skip: (page - 1) * pageSize,
  })
  const [deleteStreet] = useDeleteStreetMutation()

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await deleteStreet(id)

      if ('data' in response) {
        message.success('Вулицю успішно видалено!')
        onDelete?.(response.data.id.toString())
      } else {
        message.error('При видаленні вулиці сталася помилка')
      }
    },
    [onDelete, deleteStreet]
  )

  const handlePagination = useCallback(
    (page: number, pageSize: number) => {
      setPage(page)
      setPageSize(pageSize)

      // TODO: not page related select
      setSelected([])
      onSelect?.([])
    },
    [onSelect]
  )

  const handleSelect = useCallback(
    (streets: string[]) => {
      setSelected(streets)
      onSelect?.(streets)
    },
    [onSelect]
  )

  useEffect(() => {
    setSelected(_selected)
  }, [_selected])

  const columns = useMemo(() => {
    return [
      {
        title: 'Місто',
        width: '25%',
        dataIndex: 'city',
        filterSearch: editable,
        filters: editable ? streets?.filter.city : null,
        onFilter: (_, record: IStreet) =>
          editable && filter.city?.includes(record.city),
        filteredValue: editable ? filter.city : null,
      },
      {
        title: 'Вулиця',
        dataIndex: 'address',
        filterSearch: editable,
        filters: editable ? streets?.filter.address : null,
        onFilter: (_, record: IStreet) =>
          editable && filter.address?.includes(record.address),
        filteredValue: editable ? filter.address : null,
      },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, street: IStreet) => (
          <EditStreetButton
            street={street._id}
            editable={editable && isGlobalAdmin}
          >
            {isGlobalAdmin ? <EditFilled /> : <EyeFilled />}
          </EditStreetButton>
        ),
        hidden: !editable,
      },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, street: IStreet) => (
          <Popconfirm
            title="Ви впевнені що хочете видалити вулицю?"
            onConfirm={() => handleDelete(street._id)}
            placement="topLeft"
          >
            <Button type="dashed" danger>
              <DeleteFilled />
            </Button>
          </Popconfirm>
        ),
        hidden: !editable || !isGlobalAdmin,
      },
    ].filter((column) => !column.hidden)
  }, [editable, filter, handleDelete, isGlobalAdmin, streets])

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        editable && {
          total: streets?.total,
          current: page,
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onChange: handlePagination,
        }
      }
      rowSelection={
        editable && {
          fixed: 'left',
          type: 'checkbox',
          selectedRowKeys: selected,
          onChange: handleSelect,
        }
      }
      expandable={
        editable &&
        {
          // TODO: update domains table to pass `street?: IStreet['_id]` into props and render THIS street domains
          // expandedRowRender: (street) => <DomainsTable street={street._id} />,
        }
      }
      onChange={(_, filters) => setFilter(filters)}
      loading={isStreetsLoading}
      // BUG: antd v4.x issue, optional columns and columnsType fixed in antd v5.x
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      columns={columns}
      dataSource={streets?.data}
      scroll={{ x: 800 }}
      {...props}
    />
  )
}
