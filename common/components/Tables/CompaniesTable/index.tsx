import {
  DeleteFilled,
  EditFilled,
  EyeFilled,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import {
  useDeleteRealEstateMutation,
  useGetRealEstatesQuery,
} from '@common/api/realestateApi/realestate.api'

import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { TableProps } from '@common/components/Tables'
import { EditCompanyButton } from '@common/components/UI/Buttons/EditCompanyButton'
import { IDomain } from '@common/modules/models/Domain'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IStreet } from '@common/modules/models/Street'
// import { EditCompanyButton } from '@common/components/UI/Buttons/EditCompanyButton'
import { Roles } from '@utils/constants'
import {
  Button,
  Checkbox,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface CompaniesTableProps extends TableProps {
  domain?: IDomain['_id']
  street?: IStreet['_id']
}

export const CompaniesTable: React.FC<CompaniesTableProps> = ({
  domain: domainId,
  street: streetId,
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

  const [selected, setSelected] = useState<string[]>(_selected)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(filterable ? 10 : 5)
  const [filter, setFilter] = useState<Record<string, any>>({
    domain: domainId,
    street: streetId,
  })

  const { data: companies, isLoading: isCompaniesLoading } =
    useGetRealEstatesQuery({
      companyName: filter.companyName,
      streetId: filter.street,
      domainId: filter.domain,
      adminEmail: filter.adminEmails,
      limit: pageSize,
      skip: (page - 1) * pageSize,
    })
  const [deleteCompany] = useDeleteRealEstateMutation()

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await deleteCompany(id)

      if ('data' in response) {
        message.success('Компанію успішно видалено!')
        onDelete?.(response.data.id.toString())
      } else {
        message.error('При видаленні компанії сталася помилка')
      }
    },
    [onDelete, deleteCompany]
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
    (companies: string[]) => {
      setSelected(companies)
      onSelect?.(companies)
    },
    [onSelect]
  )

  useEffect(() => {
    setSelected(_selected)
  }, [_selected])

  const columns = useMemo(() => {
    return [
      {
        title: 'Назва',
        width: '250px',
        dataIndex: 'companyName',
        render: (companyName: string, record) =>
          record.description ? (
            <Tooltip title={record.description}>
              <QuestionCircleOutlined /> {companyName}
            </Tooltip>
          ) : (
            companyName
          ),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: companies?.filter.companyName,
          filteredValue: filter.companyName,
        }),
      },
      {
        title: 'Надавач послуг',
        width: '250px',
        dataIndex: 'domain',
        render: (domain: IDomain) => domain?.name,
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: companies?.filter.domain,
          filteredValue: filter.domain,
        }),
      },
      {
        title: 'Адреса',
        width: '300px',
        dataIndex: 'street',
        render: (street: IStreet) => (
          <>
            вул. {street?.address} (м. {street?.city})
          </>
        ),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: companies?.filter.street,
          filteredValue: filter.street,
        }),
      },
      {
        title: 'Представники',
        width: '250px',
        dataIndex: 'adminEmails',
        render: (adminEmails: string[]) => (
          <>
            {adminEmails.map((adminEmail, index) => (
              <Tag key={index}>{adminEmail}</Tag>
            ))}
          </>
        ),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: companies?.filter.adminEmails,
          filteredValue: filter.adminEmails,
        }),
      },
      {
        title: 'грн/м2',
        dataIndex: 'pricePerMeter',
        hidden: !extended,
      },
      {
        title: 'Сервіс (грн/м2)',
        dataIndex: 'pricePerMeter',
        hidden: !extended,
      },
      {
        title: 'Площа (м2)',
        dataIndex: 'pricePerMeter',
        hidden: !extended,
      },
      {
        title: 'Частка',
        children: [
          {
            title: 'Утримання',
            dataIndex: 'rentPart',
          },
          {
            title: 'Вода',
            dataIndex: 'waterPart',
          },
        ],
        hidden: !extended,
      },
      {
        title: 'Прибирання',
        dataIndex: 'cleaning',
        hidden: !extended,
      },
      {
        title: 'Вивіз ТПВ', // TODO: tooltip
        dataIndex: 'garbageCollector',
        render: (garbageCollector: boolean) => (
          <Checkbox checked={garbageCollector} />
        ),
        hidden: !extended,
      },
      {
        title: 'Інфляція',
        dataIndex: 'inflicion',
        render: (inflicion: boolean) => <Checkbox checked={inflicion} />,
        hidden: !extended,
      },
      {
        title: 'Знижка',
        dataIndex: 'discount',
        hidden: !extended,
      },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, company: IRealEstate) => (
          <EditCompanyButton
            company={company?._id}
            editable={
              isGlobalAdmin || company?.adminEmails.includes(user?.email)
            }
          >
            {isGlobalAdmin || isGlobalAdmin ? <EditFilled /> : <EyeFilled />}
          </EditCompanyButton>
        ),
        hidden: !editable,
      },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, company: IRealEstate) => (
          <Popconfirm
            title="Ви впевнені що хочете видалити компанію?"
            onConfirm={() => handleDelete(company?._id)}
            placement="topLeft"
          >
            <Button
              type="dashed"
              danger
              disabled={
                !isGlobalAdmin && !company.adminEmails.includes(user?.email)
              }
            >
              <DeleteFilled />
            </Button>
          </Popconfirm>
        ),
        hidden: !editable,
      },
    ].filter((column) => !column.hidden)
  }, [
    editable,
    extended,
    filterable,
    filter,
    handleDelete,
    isGlobalAdmin,
    companies,
    user,
  ])

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        filterable && {
          total: companies?.total,
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
      //   expandedRowRender: (record) => <></>,
      // }}
      onChange={(_, filters) => setFilter(filters)}
      loading={isCompaniesLoading}
      // BUG: antd v4.x issue, optional columns and columnsType fixed in antd v5.x
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      columns={columns}
      dataSource={companies?.data}
      scroll={{ x: extended ? 2400 : 1200 }}
      {...props}
    />
  )
}
