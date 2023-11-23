import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, Popconfirm, Table, Tag, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import { useDeleteRealEstateMutation } from '@common/api/realestateApi/realestate.api'
import {
  IExtendedRealestate,
  IGetRealestateResponse,
} from '@common/api/realestateApi/realestate.api.types'
import { AppRoutes, Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { isAdminCheck } from '@utils/helpers'
import { IFilter } from '@common/api/paymentApi/payment.api.types'

export interface Props {
  domainId?: string
  streetId?: string
  setCurrentRealEstate?: (realEstate: IExtendedRealestate) => void
  realEstates: IGetRealestateResponse
  isLoading: boolean
  isError: boolean
  filters?: any
  setFilters?: (filters: any) => void
}

const CompaniesTable: React.FC<Props> = ({
  domainId,
  streetId,
  setCurrentRealEstate,
  realEstates,
  isLoading,
  isError,
  filters,
  setFilters,
}) => {
  const router = useRouter()
  const { pathname } = router
  const isOnPage = pathname === AppRoutes.REAL_ESTATE

  const { data: userResponse } = useGetCurrentUserQuery()

  const [deleteRealEstate, { isLoading: deleteLoading }] =
    useDeleteRealEstateMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteRealEstate(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isAdmin = isAdminCheck(userResponse?.roles)

  const tableWidth =
    1800 +
    (isGlobalAdmin ? 50 : 0) +
    (!domainId && !streetId && !isLoading ? 400 : 0)

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        !isOnPage && {
          hideOnSinglePage: true,
        }
      }
      loading={isLoading}
      columns={getDefaultColumns({
        domainId,
        streetId,
        isLoading,
        handleDelete,
        setCurrentRealEstate,
        deleteLoading,
        isGlobalAdmin,
        isAdmin,
        domainsFilter: realEstates?.domainsFilter,
        realEstatesFilter: realEstates?.realEstatesFilter,
        filters,
        pathname,
      })}
      dataSource={realEstates?.data}
      scroll={{ x: tableWidth }}
      onChange={(__, filters) => {
        setFilters({
          domain: filters?.domain,
          company: filters?.companyName,
        })
      }}
    />
  )
}

const getDefaultColumns = ({
  domainId,
  streetId,
  isLoading,
  handleDelete,
  setCurrentRealEstate,
  deleteLoading,
  isGlobalAdmin,
  isAdmin,
  domainsFilter,
  realEstatesFilter,
  filters,
  pathname,
}: {
  domainId?: string
  streetId?: string
  isLoading?: boolean
  handleDelete?: (...args: any) => void
  setCurrentRealEstate?: (realEstate: IExtendedRealestate) => void
  deleteLoading?: boolean
  isGlobalAdmin?: boolean
  isAdmin?: boolean
  domainsFilter?: IFilter[]
  realEstatesFilter?: IFilter[]
  filters?: any
  pathname?: string
}): ColumnType<any>[] => {
  const columns: ColumnType<any>[] = [
    {
      title: 'Адміністратори',
      dataIndex: 'adminEmails',
      width: 250,
      render: (adminEmails) =>
        adminEmails.map((email) => <Tag key={email}>{email}</Tag>),
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      width: 350,
    },
    // TODO: enum
    {
      title: 'Кількість метрів',
      dataIndex: 'totalArea',
    },
    {
      title: 'Ціна за метр',
      dataIndex: 'pricePerMeter',
    },
    {
      title: 'Індивідуальне утримання за метр',
      dataIndex: 'servicePricePerMeter',
    },
    {
      title: 'Частка загальної площі',
      dataIndex: 'rentPart',
    },
    {
      title: 'Частка водопостачання',
      dataIndex: 'waterPart',
    },
    {
      title: 'Прибирання',
      dataIndex: 'cleaning',
    },
    {
      title: 'Знижка',
      dataIndex: 'discount',
    },
    {
      align: 'center',
      title: 'Вивіз сміття',
      dataIndex: 'garbageCollector',
      render: (value) => <Checkbox checked={value} disabled />,
    },
    {
      align: 'center',
      title: 'Нарахування інд. інф.',
      dataIndex: 'inflicion',
      render: (value) => <Checkbox checked={value} disabled />,
    },
    {
      align: 'center',
      title: 'Нарахування МЗК',
      dataIndex: 'publicElectricUtility',
      render: (value) => <Checkbox checked={value} disabled />,
    },
  ]

  if (isAdmin) {
    columns.push({
      align: 'center',
      fixed: 'right',
      title: '',
      width: 50,
      render: (_, realEstate: IExtendedRealestate) => (
        <Button
          style={{ padding: 0 }}
          type="link"
          onClick={() => setCurrentRealEstate(realEstate)}
        >
          <EditOutlined />
        </Button>
      ),
    })
  }

  if (isGlobalAdmin) {
    columns.push({
      align: 'center',
      fixed: 'right',
      title: '',
      dataIndex: '',
      width: 50,
      render: (_, realEstate: IExtendedRealestate) => (
        <Popconfirm
          title={`Ви впевнені що хочете видалити нерухомість?`}
          onConfirm={() => handleDelete(realEstate?._id)}
          cancelText="Відміна"
          disabled={deleteLoading}
        >
          <DeleteOutlined />
        </Popconfirm>
      ),
    })
  }

  const domainColumn: any = {
    title: 'Надавач послуг',
    dataIndex: 'domain',
    width: 200,
    render: (i) => i?.name,
  }

  const companyColumn: any = {
    fixed: 'left',
    title: 'Назва компанії',
    dataIndex: 'companyName',
    width: 200,
  }

  if (isAdmin) {
    companyColumn.filters =
      pathname === AppRoutes.REAL_ESTATE ? realEstatesFilter : null
    companyColumn.filteredValue = filters?.company || null

    domainColumn.filters =
      pathname === AppRoutes.REAL_ESTATE ? domainsFilter : null
    domainColumn.filteredValue = filters?.domain || null
  }

  if (!domainId && !streetId && !isLoading) {
    columns.unshift(domainColumn, {
      title: 'Адреса',
      dataIndex: 'street',
      width: 200,
      render: (i) => (
        <>
          {i?.address} (м. {i?.city})
        </>
      ),
    })
  }

  columns.unshift(companyColumn)

  return columns
}

export default CompaniesTable
