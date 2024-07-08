import { DeleteFilled, EditFilled, EyeFilled } from '@ant-design/icons'
import {
  useDeletePaymentMutation,
  useGetPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { TableProps } from '@common/components/Tables'
import { EditPaymentButton } from '@common/components/UI/Buttons/EditPaymentButton'
import { EditServiceButton } from '@common/components/UI/Buttons/EditServiceButton'
import { IDomain } from '@common/modules/models/Domain'
import { IPayment } from '@common/modules/models/Payment'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { Roles } from '@utils/constants'
import { NumberToFormattedMonth, renderCurrency } from '@utils/helpers'
import { Button, Popconfirm, Table, Tag, Tooltip } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface PaymentsTableProps extends TableProps {
  domain?: IDomain['_id']
  street?: IStreet['_id']
  company?: IRealEstate['_id']
  service?: IService['_id']
  type?: IPayment['type']
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  domain: domainId = [],
  street: streetId = [],
  company: companyId = [],
  service: serviceId = [],
  type,
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
    domain: domainId,
    street: streetId,
    company: companyId,
    monthService: serviceId,
    type,
  })

  const { data: payments, isLoading: isPaymentsLoading } = useGetPaymentsQuery({
    domainId: filter.domain,
    streetId: filter.street,
    companyId: filter.company,
    serviceId: filter.monthService,
    type: filter.type,
    month: filter.month,
    year: filter.year,
    limit: pageSize,
    skip: (page - 1) * pageSize,
  })
  const [deletePayment] = useDeletePaymentMutation()

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await deletePayment(id)

      // TODO: proper Payment types
      // if ('data' in response) {
      //   message.success('Послугу успішно видалено!')
      //   onDelete?.(response.data.id.toString())
      // } else {
      //   message.error('При видаленні послуги сталася помилка')
      // }
    },
    [onDelete, deletePayment]
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
    (payments: string[]) => {
      setSelected(payments)
      onSelect?.(payments)
    },
    [onSelect]
  )

  useEffect(() => {
    setSelected(_selected)
  }, [_selected])

  const columns = useMemo(() => {
    return [
      {
        title: 'Компанія',
        dataIndex: 'company',
        width: 200,
        render: (company: IRealEstate) => company?.companyName,
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: payments?.filter.company,
          filteredValue: filter.company,
        }),
      },
      {
        title: 'Надавач послуг',
        dataIndex: 'domain',
        width: 200,
        render: (domain: IDomain) => domain?.name,
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: payments?.filter.domain,
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
          filters: payments?.filter.street,
          filteredValue: filter.street,
        }),
        hidden: !extended,
      },
      {
        title: 'Послуга',
        dataIndex: 'monthService',
        width: 100,
        render: (service: IService) => (
          <EditServiceButton
            type="dashed"
            editable={isGlobalAdmin}
            service={service?._id}
          >
            {isGlobalAdmin ? <EditFilled /> : <EyeFilled />}
          </EditServiceButton>
        ),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        // TODO: proper filter by service
        // ...(filterable && {
        //   filterSearch: true,
        //   filters: payments?.filter.monthService,
        //   filteredValue: filter.monthService,
        // }),
        hidden: !editable || !extended,
      },
      {
        title: 'Тип',
        dataIndex: 'type',
        width: 80,
        render: (type: IPayment['type']) => (
          <Tag color={type === 'debit' ? 'purple' : 'blue'}>
            {type === 'debit' ? 'Дебет' : 'Кредит'}
          </Tag>
        ),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: payments?.filter.type,
          filteredValue: filter.type,
        }),
      },
      {
        title: 'Статус',
        // TODO: implement this
        dataIndex: 'status',
        width: 100,
        // TODO: proper typing (almost the same as .type)
        render: (status: any) => <Tag color="orange">TODO</Tag>,
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        // TODO: implement status filtering (the same as .type)
        // ...(filterable && {
        //   filterSearch: true,
        //   filters: payments?.filter.status,
        //   filteredValue: filter.status,
        // }),
      },
      {
        title: 'Сума',
        dataIndex: 'generalSum',
        width: 100,
        render: renderCurrency,
      },
      {
        title: 'Місяць',
        width: 120,
        dataIndex: 'month',
        render: (_, { invoiceCreationDate }: IPayment) =>
          NumberToFormattedMonth(new Date(invoiceCreationDate).getMonth() + 1),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: payments?.filter.month,
          filteredValue: filter.month,
        }),
      },
      {
        title: 'Рік',
        width: 100,
        dataIndex: 'year',
        render: (_, { invoiceCreationDate }: IPayment) =>
          new Date(invoiceCreationDate).getFullYear(),
        // BUG: Warning: [antd: Table] Columns should all contain `filteredValue` or not contain `filteredValue`.
        ...(filterable && {
          filterSearch: true,
          filters: payments?.filter.year,
          filteredValue: filter.year,
        }),
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
        render: (_, payment: IPayment) => (
          <EditPaymentButton
            payment={payment._id}
            editable={isDomainAdmin || isGlobalAdmin}
          >
            {isDomainAdmin || isGlobalAdmin ? <EditFilled /> : <EyeFilled />}
          </EditPaymentButton>
        ),
        hidden: !editable,
      },
      {
        align: 'center',
        fixed: 'right',
        width: 64,
        render: (_, payment: IPayment) => (
          <Popconfirm
            title="Ви впевнені що хочете видалити проплату?"
            onConfirm={() => handleDelete(payment._id)}
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
    payments,
  ])

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        filterable && {
          total: payments?.total,
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
          // expandedRowRender: (record) => <></>,
        }
      }
      onChange={(_, filters) => setFilter(filters)}
      loading={isPaymentsLoading}
      // BUG: antd v4.x issue, optional columns and columnsType fixed in antd v5.x
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      columns={columns}
      dataSource={payments?.data}
      scroll={{ x: extended ? 1200 : 600 }}
      {...props}
    />
  )
}
