import { DeleteFilled, QuestionCircleOutlined } from '@ant-design/icons'
import {
  useDeleteDomainMutation,
  useGetDomainsFiltersQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { TableProps } from '@common/components/Tables'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Roles } from '@utils/constants'
import {
  Button,
  message,
  Popconfirm,
  Table,
  TableColumnsType,
  Tag,
  Tooltip,
} from 'antd'
import { useCallback, useMemo, useState } from 'react'

export interface DomainsTableProps extends TableProps {
  streets?: IStreet['_id'][]
}

export const DomainsTable: React.FC<DomainsTableProps> = ({
  streets: streetsIds = [],
  onSelect,
  onDelete,
  editable = false,
  extended = false,
  expandable = false,
  filterable = false,
  selectable = false,
  ...props
}) => {
  const { data: user } = useGetCurrentUserQuery()

  const isGlobalAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.GLOBAL_ADMIN)
  }, [user])
  const isDomainAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.DOMAIN_ADMIN)
  }, [user])

  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [filtered, setFiltered] = useState<Record<string, any>>({
    streets: streetsIds,
  })

  const {
    data: { data: domains, total } = { data: [], total: 0 },
    isLoading: isDomainsLoading,
  } = useGetDomainsQuery({
    domainId: filtered.domains,
    streetId: filtered.streets,
    adminEmails: filtered.adminEmails,
    limit: pageSize,
    skip: (page - 1) * pageSize,
  })

  const { data: filters, isLoading: isFiltersLoading } =
    useGetDomainsFiltersQuery()

  const [deleteDomain] = useDeleteDomainMutation()

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await deleteDomain(id)

      if ('data' in response) {
        message.success('Надавача послуг успішно видалено!')
        onDelete?.(response.data.data)
      } else {
        message.error('При видаленні надавача послуг сталася помилка')
      }
    },
    [onDelete, deleteDomain]
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
    (domains: string[]) => {
      setSelected(domains)
      onSelect?.(domains)
    },
    [onSelect]
  )

  const columns: TableColumnsType<IDomain> = useMemo(() => {
    return [
      {
        title: (
          <Tooltip title={'TODO: domains definition'}>
            Надавач послуг <QuestionCircleOutlined />
          </Tooltip>
        ),
        width: '250px',
        fixed: 'left',
        dataIndex: 'name',
        render: (name: string, record: IDomain) =>
          record.description ? (
            <Tooltip title={record.description}>
              <QuestionCircleOutlined /> {name}
            </Tooltip>
          ) : (
            name
          ),
        ...(filterable && {
          filterSearch: true,
          filters: filters?.domains,
          filteredValue: filtered.domains,
        }),
      },
      {
        title: 'Вулиці',
        dataIndex: 'streets',
        render: (streets: IStreet[]) => (
          <>
            {streets.map((street) => (
              <Tag key={street._id}>
                вул. {street.address} (м. {street.city})
              </Tag>
            ))}
          </>
        ),
        ...(filterable && {
          filterSearch: true,
          filters: filters?.streets,
          filteredValue: filtered.streets,
        }),
      },
      {
        title: 'Представники',
        dataIndex: 'adminEmails',
        render: (adminEmails: string[]) => (
          <>
            {adminEmails.map((adminEmail, index) => (
              <Tag key={index}>{adminEmail}</Tag>
            ))}
          </>
        ),
        ...(filterable && {
          filterSearch: true,
          filters: filters?.adminEmails,
          filteredValue: filtered.adminEmails,
        }),
      },
      // {
      //   align: 'center',
      //   fixed: 'right',
      //   width: 64,
      //   render: (_, domain: IDomain) => (
      //     <EditDomainButton domain={domain._id} editable={isDomainAdmin || isGlobalAdmin}>
      //       {isDomainAdmin || isGlobalAdmin ? <EditFilled /> : <EyeFilled />}
      //     </EditDomainButton>
      //   ),
      //   hidden: !editable,
      // },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, domain: IDomain) => (
          <Popconfirm
            title="Ви впевнені що хочете видалити надавача послуг?"
            onConfirm={() => handleDelete(domain._id)}
            placement="topLeft"
          >
            <Button type="dashed" danger>
              <DeleteFilled />
            </Button>
          </Popconfirm>
        ),
        hidden: !editable || (!isDomainAdmin && !isGlobalAdmin),
      },
    ]
  }, [
    filterable,
    editable,
    filters,
    filtered,
    isDomainAdmin,
    isGlobalAdmin,
    handleDelete,
  ])

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        filterable && {
          total: total,
          current: page,
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onChange: handlePagination,
        }
      }
      rowSelection={
        selectable && {
          fixed: 'left',
          type: 'checkbox',
          selectedRowKeys: selected,
          onChange: handleSelect,
        }
      }
      // expandable={{
      //   rowExpandable: (record) => expandable,
      //   expandedRowRender: (record) => <CompaniesTable domain={record._id} />,
      // }}
      onChange={(_, filteredValue) =>
        setFiltered({
          domains: filteredValue.name,
          streets: filteredValue.streets,
          adminEmails: filteredValue.adminEmails,
        })
      }
      loading={isDomainsLoading || isFiltersLoading}
      columns={columns}
      dataSource={domains}
      scroll={{ x: 1200 }}
      {...props}
    />
  )
}
