import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  InboxOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { IFilter } from '@common/api/paymentApi/payment.api.types'
import {
  useDeleteRealEstateMutation,
  useUpdateArchivedItemMutation,
} from '@common/api/realestateApi/realestate.api'
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
  message,
  Tooltip,
  Dropdown,
} from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'
import {
  useGetAddressFiltersQuery,
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery
} from "@common/api/filterApi/filter.api";
// import { useGetRealEstateFiltersQuery } from '@common/api/filterApi/filter.api'

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

  const { data: realEstate } = useGetRealEstateFiltersQuery()
  const { data: domain } = useGetDomainFiltersQuery()
  const { data: street } = useGetAddressFiltersQuery()

  const [deleteRealEstate, { isLoading: deleteLoading }] =
    useDeleteRealEstateMutation()
  const [updateArchivedItem, { isLoading: archiveLoading }] =
    useUpdateArchivedItemMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteRealEstate(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }
  const handleArchive = async (id: string, archived: boolean) => {
    try {
      const response = await updateArchivedItem({ _id: id, archived })
      if ('data' in response) {
        message.success(
          archived ? 'Компанію архівовано' : 'Компанію розархівовано'
        )
      } else {
        message.error('Помилка при зміні архівного статусу')
      }
    } catch (error) {
      message.error('Виникла помилка')
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
        archiveLoading,
        handleArchive,
        domainId,
        streetId,
        isLoading,
        handleDelete,
        setCurrentRealEstate,
        deleteLoading,
        isGlobalAdmin,
        isAdmin,
        domainsFilter: domain?.domainsFilter,
        streetsFilter: street?.streetsFilter,
        realEstatesFilter: realEstate?.realEstatesFilter,
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
  archiveLoading,
  handleArchive,
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
  handleArchive?: (...args: any) => void
  archiveLoading?: boolean
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
      width: 40,
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
      width: 98,
      render: (_, realEstate: IExtendedRealestate) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: (
                  <Button
                    icon={<EditOutlined />}
                    type="link"
                    style={{
                      color: '#722ed1',
                      paddingLeft: '10px',
                      paddingRight: '10px',
                    }}
                    onClick={() => {
                      setCurrentRealEstate(realEstate)
                      setRealEstateActions({ edit: true })
                    }}
                  >
                    Редагувати
                  </Button>
                ),
              },
              {
                key: 'archive',
                label: (
                  <Popconfirm
                    id="popconfirm_archive"
                    title={`Ви впевнені що хочете ${
                      realEstate.archived ? 'розархівувати' : 'архівувати'
                    } цей елемент?`}
                    onConfirm={() =>
                      handleArchive(realEstate?._id, !realEstate.archived)
                    }
                    okText={
                      realEstate.archived ? 'Розархівувати' : 'Архівувати'
                    }
                    cancelText="Ні"
                    disabled={archiveLoading}
                  >
                    <Button
                      type="text"
                      icon={<InboxOutlined />}
                      style={{
                        color: realEstate.archived ? '#722ed1' : '#ff4d4f',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                      }}
                    >
                      {realEstate.archived ? 'Розархівувати' : 'Архівувати'}
                    </Button>
                  </Popconfirm>
                ),
              },
              isGlobalAdmin && {
                key: 'delete',
                label: (
                  <Popconfirm
                    id="popconfirm_custom"
                    title={`Ви впевнені що хочете видалити нерухомість?`}
                    onConfirm={() => handleDelete(realEstate?._id)}
                    okText="Видалити"
                    cancelText="Ні"
                    disabled={deleteLoading}
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      style={{
                        color: '#ff4d4f',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                      }}
                    >
                      Видалити
                    </Button>
                  </Popconfirm>
                ),
              },
            ],
          }}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
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
