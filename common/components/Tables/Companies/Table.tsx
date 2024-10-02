import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { useDeleteRealEstateMutation } from '@common/api/realestateApi/realestate.api'
import {
  IExtendedRealestate,
  IGetRealestateResponse,
} from '@common/api/realestateApi/realestate.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import {
  Alert,
  Button,
  Checkbox,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

export interface Props {
  domainId?: string
  streetId?: string
  setCurrentRealEstate?: (realEstate: IExtendedRealestate) => void
  realEstates: IGetRealestateResponse
  isLoading: boolean
  isError: boolean
  filters?: any
  setFilters?: (filters: any) => void
  setRealEstateActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
  realEstateActions: {
    edit: boolean
  }
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
  setRealEstateActions,
  realEstateActions,
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
      pagination={
        (router.pathname === AppRoutes.REAL_ESTATE ||
          router.pathname === AppRoutes.SEP_DOMAIN) && {
          hideOnSinglePage: false,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          position: ['bottomCenter'],
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
        streetsFilter: realEstates?.streetsFilter,
        realEstatesFilter: realEstates?.realEstatesFilter,
        filters,
        pathname,
        setRealEstateActions,
      })}
      dataSource={realEstates?.data}
      scroll={{ x: tableWidth }}
      onChange={(__, filters) => {
        setFilters({
          domain: filters?.domain,
          company: filters?.companyName,
          street: filters?.street,
        })
      }}
    />
  )
}

const renderTooltip = (text: string) => {
  return (
    <Tooltip title={text} placement="top">
      <QuestionCircleOutlined />
    </Tooltip>
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
  streetsFilter,
  realEstatesFilter,
  filters,
  pathname,
  setRealEstateActions,
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
  streetsFilter: IFilter[]
  filters?: any
  pathname?: string
  setRealEstateActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
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
      width: 100,
      ellipsis: true,
      align: 'center',
      render: renderTooltip,
    },
    // TODO: enum
    {
      title: 'Площа (м²)',
      dataIndex: 'totalArea',
      width: 120,
      align: 'center',
    },
    {
      title: 'Ціна (грн/м²)',
      dataIndex: 'pricePerMeter',
      width: 120,
      align: 'center',
    },
    {
      title: 'Індивідуальне утримання (грн/м²)',
      dataIndex: 'servicePricePerMeter',
      width: 200,
      align: 'center',
    },
    {
      title: 'Частка загальної площі',
      dataIndex: 'rentPart',
      width: 180,
      align: 'center',
    },
    {
      title: 'Частка водопостачання',
      dataIndex: 'waterPart',
      width: 180,
      align: 'center',
    },
    {
      title: 'Прибирання (грн)',
      dataIndex: 'cleaning',
      width: 150,
      align: 'center',
    },
    {
      title: 'Знижка',
      dataIndex: 'discount',
      width: 150,
      align: 'center',
    },
    {
      align: 'center',
      title: 'Вивіз сміття',
      dataIndex: 'garbageCollector',
      width: 150,
      render: (value) => <Checkbox checked={value} disabled />,
    },
    {
      align: 'center',
      title: 'Нарахування інд. інф.',
      dataIndex: 'inflicion',
      width: 170,
      render: (value) => <Checkbox checked={value} disabled />,
    },
    {
      fixed: 'right',
      align: 'center',
      title: '',
      width: 50,
      render: (_, realEstate: IExtendedRealestate) => (
        <Button
          icon={<EyeOutlined />}
          type="link"
          onClick={() => {
            setCurrentRealEstate(realEstate)
            setRealEstateActions({ edit: false })
          }}
        />
      ),
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
          icon={<EditOutlined />}
          type="link"
          onClick={() => {
            setCurrentRealEstate(realEstate)
            setRealEstateActions({ edit: true })
          }}
        />
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
          id="popconfirm_custom"
          title={`Ви впевнені що хочете видалити нерухомість?`}
          onConfirm={() => handleDelete(realEstate?._id)}
          okText="Видалити"
          cancelText="Ні"
          disabled={deleteLoading}
        >
          <Button type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    })
  }

  const domainColumn: any = {
    title: 'Надавач послуг',
    dataIndex: 'domain',
    width: 200,
    render: (i) => i?.name,
    hidden: domainsFilter?.length <= 1,
    filterSearch: true,
  }

  const companyColumn: any = {
    fixed: 'left',
    title: 'Назва компанії',
    dataIndex: 'companyName',
    width: 200,
    filterSearch: true,
  }

  const streetColumn: any = {
    title: 'Адреса',
    dataIndex: 'street',
    width: 200,
    filterSearch: true,
    render: (i) => (
      <>
        {i?.address} (м. {i?.city})
      </>
    ),
  }

  if (isAdmin) {
    companyColumn.filters =
      pathname === AppRoutes.REAL_ESTATE ? realEstatesFilter : null
    companyColumn.filteredValue = filters?.company || null

    domainColumn.filters =
      pathname === AppRoutes.REAL_ESTATE ? domainsFilter : null
    domainColumn.filteredValue = filters?.domain || null

    streetColumn.filters =
      pathname === AppRoutes.REAL_ESTATE ? streetsFilter : null
    streetColumn.filteredValue = filters?.street || null
  }

  columns.unshift(streetColumn)

  columns.unshift(domainColumn)

  columns.unshift(companyColumn)

  return columns
}

export default CompaniesTable
