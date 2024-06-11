import {
  DeleteFilled,
  EditFilled,
  EyeFilled,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import {
  useDeleteServiceMutation,
  useGetServicesQuery,
} from '@common/api/serviceApi/service.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { TableProps } from '@common/components/Tables'
import { EditServiceButton } from '@common/components/UI/Buttons/EditServiceButton'
import { IDomain } from '@common/modules/models/Domain'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { Roles } from '@utils/constants'
import { NumberToFormattedMonth, renderCurrency } from '@utils/helpers'
import { Button, Popconfirm, Table, Tooltip } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface ServicesTableProps extends TableProps {
  domain?: IDomain['_id']
  street?: IStreet['_id']
}

export const ServicesTable: React.FC<ServicesTableProps> = ({
  domain: domainId = [],
  street: streetId = [],
  selected: _selected = [],
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

  const [selected, setSelected] = useState<string[]>(_selected)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(filterable ? 10 : 5)
  const [filter, setFilter] = useState<Record<string, any>>({
    street: streetId,
    domain: domainId,
  })

  const { data: services, isLoading: isServicesLoading } = useGetServicesQuery({
    streetId: filter.street,
    domainId: filter.domain,
    month: filter.month,
    year: filter.year,
    limit: pageSize,
    skip: (page - 1) * pageSize,
  })
  const [deleteService] = useDeleteServiceMutation()

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await deleteService(id)

      // TODO: proper Service types
      // if ('data' in response) {
      //   message.success('Послугу успішно видалено!')
      //   onDelete?.(response.data.id.toString())
      // } else {
      //   message.error('При видаленні послуги сталася помилка')
      // }
    },
    [onDelete, deleteService]
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
    (services: string[]) => {
      setSelected(services)
      onSelect?.(services)
    },
    [onSelect]
  )

  useEffect(() => {
    setSelected(_selected)
  }, [_selected])

  const columns = useMemo(() => {
    return [
      {
        title: 'Надавач послуг',
        dataIndex: 'domain',
        width: 200,
        render: (domain: IDomain) => domain?.name,
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: services?.filter.domain,
          filteredValue: filter.domain,
        }),
      },
      {
        title: 'Вулиця',
        dataIndex: 'street',
        width: 300,
        render: (street: IStreet) =>
          `вул. ${street?.address} (м. ${street?.city})`,
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: services?.filter.street,
          filteredValue: filter.street,
        }),
      },
      {
        title: 'Місяць',
        width: 150,
        dataIndex: 'month',
        render: (_, { date }: IService) =>
          NumberToFormattedMonth(new Date(date).getMonth() + 1),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: services?.filter.month,
          filteredValue: filter.month,
        }),
      },
      {
        title: 'Рік',
        width: 100,
        dataIndex: 'year',
        render: (_, { date }: IService) => new Date(date).getFullYear(),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: services?.filter.year,
          filteredValue: filter.year,
        }),
      },
      {
        title: 'Утримання',
        dataIndex: 'rentPrice',
        width: 100,
        render: renderCurrency,
        hidden: !extended,
      },
      {
        title: 'Електрика',
        dataIndex: 'electricityPrice',
        width: 100,
        render: renderCurrency,
        hidden: !extended,
      },
      {
        title: 'Вода',
        dataIndex: 'waterPrice',
        width: 100,
        render: renderCurrency,
        hidden: !extended,
      },
      {
        title: 'Вода???',
        dataIndex: 'waterPriceTotal',
        width: 100,
        render: renderCurrency,
        hidden: !extended,
      },
      {
        title: 'Вивіз ТПВ',
        dataIndex: 'garbageCollectorPrice',
        width: 100,
        render: renderCurrency,
        hidden: !extended,
      },
      {
        title: (
          <Tooltip title="Індекс Інфляції">
            <QuestionCircleOutlined /> Індекс
          </Tooltip>
        ),

        dataIndex: 'inflicionPrice',
        width: 100,
        hidden: !extended,
      },
      {
        title: 'Опис',
        dataIndex: 'description',
        width: 200,
        ellipsis: true,
        render: (description) => (
          <Tooltip title={description}>{description}</Tooltip>
        ),
      },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, service: IService) => (
          <EditServiceButton
            service={service._id}
            editable={isDomainAdmin || isGlobalAdmin}
          >
            {isDomainAdmin || isGlobalAdmin ? <EditFilled /> : <EyeFilled />}
          </EditServiceButton>
        ),
        hidden: !editable,
      },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, service: IService) => (
          <Popconfirm
            title="Ви впевнені що хочете видалити послугу?"
            onConfirm={() => handleDelete(service._id)}
            placement="topLeft"
          >
            <Button type="dashed" danger>
              <DeleteFilled />
            </Button>
          </Popconfirm>
        ),
        hidden: !editable || (!isDomainAdmin && !isGlobalAdmin),
      },
    ].filter((column) => !column.hidden)
  }, [
    editable,
    extended,
    filterable,
    filter,
    handleDelete,
    isDomainAdmin,
    isGlobalAdmin,
    services,
  ])

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        filterable && {
          total: services?.total,
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
      expandable={
        {
          // rowExpandable: (record) => expandable,
          // expandedRowRender: (record) => <PaymentsTable service={record._id} />,
        }
      }
      onChange={(_, filters) => setFilter(filters)}
      loading={isServicesLoading}
      // BUG: antd v4.x issue, optional columns and columnsType fixed in antd v5.x
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      columns={columns}
      dataSource={services?.data}
      scroll={{ x: extended ? 1600 : 800 }}
      {...props}
    />
  )
}