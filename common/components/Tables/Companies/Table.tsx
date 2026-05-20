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
import {
  formatDebt,
  isAdminCheck,
  renderCurrency,
  renderPrice,
} from '@utils/helpers'
import { getDebtorTooltipColor } from '@utils/helpers'
import s from './style.module.scss'
import {
  Alert,
  Button,
  Checkbox,
  Popconfirm,
  Table,
  message,
  Tooltip,
  Dropdown,
  Switch,
  Badge,
} from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'
import {
  useGetAddressFiltersQuery,
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} from '@common/api/filterApi/filter.api'
import { useEffect, useState, useMemo } from 'react'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'
import CollapsedTags from '@components/UI/CollapsedTags'

type DebtPerMonth = {
  monthService: string
  totalDue: number
  paid: number
  remaining: number
}

type CompanyWithPayments = {
  companyId: any
  companyName: string
  debtPerMonth: DebtPerMonth[]
  totalDebt: number
}

// Human-readable names of standard service columns — used to exclude duplicates from customServices
const STANDARD_SERVICE_NAMES = [
  'Опис',
  'Площа (м²)',
  'Ціна (грн/м²)',
  'Індивідуальне утримання (грн/м²)',
  'Частка загальної площі',
  'Частка водопостачання',
  'Прибирання (грн)',
  'Знижка',
  'Вивіз сміття',
  'Нарахування інд. інф.',
]

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
  isArchive: boolean
  customServices?: { _id: string; name: string }[]
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
  isArchive,
  customServices,
}) => {
  const router = useRouter()
  const { pathname } = router

  const { data: userResponse } = useGetCurrentUserQuery()

  const { data: realEstateData } = useGetRealEstateFiltersQuery({
    streets: filters?.street,
    domains: filters?.domain,
    archived: isArchive,
  })
  const { data: domainData } = useGetDomainFiltersQuery({
    streets: filters?.street,
    realEstates: filters?.company,
  })
  const { data: streetData } = useGetAddressFiltersQuery({
    realEstates: filters?.company,
    domains: filters?.domain ?? domainData?.domainsFilter?.map((d) => d.value),
  })

  const [realEstate, setRealEstate] = useState(null)
  const [domain, setDomain] = useState(null)
  const [street, setStreet] = useState(null)

  useEffect(() => {
    setRealEstate(realEstateData)
    setDomain(domainData)
    setStreet(streetData)
  }, [filters, realEstateData, domainData, streetData])

  const [domainIds, setDomainIds] = useState([])

  useEffect(() => {
    if (domainData?.domainsFilter) {
      setDomainIds(domainData?.domainsFilter.map((domain) => domain.value))
    }
  }, [domainData])
  const { data, error } = useGetDebtorsQuery(
    { domainIds: domainIds },
    { skip: !domainIds || domainIds.length === 0 }
  )
  const debtorCompanies = data?.companies

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
  const isUser = userResponse?.roles?.includes(Roles.USER)
  const isAdmin = isAdminCheck(userResponse?.roles)

  const tableWidth =
    1800 +
    (isGlobalAdmin ? 50 : 0) +
    (!domainId && !streetId && !isLoading ? 400 : 0)

  const isSingleCompanyByData = useMemo(() => {
    return realEstateData?.realEstatesFilter?.length === 1
  }, [realEstateData?.realEstatesFilter?.length])

  const filteredCustomServices = useMemo(() => {
    return customServices?.filter((custom) => {
      return !STANDARD_SERVICE_NAMES.includes(custom.name)
    })
  }, [customServices])

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      locale={{
        cancelSort: 'Скасувати сортування',
        triggerAsc: 'Сортувати за зростанням',
        triggerDesc: 'Сортувати за спаданням',
      }}
      pagination={
        (router.pathname === AppRoutes.REAL_ESTATE ||
          router.pathname === AppRoutes.SEP_DOMAIN) && {
          hideOnSinglePage: false,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          position: ['bottomCenter'],
          showTotal: () =>
            !isUser && (
              <Switch
                checkedChildren="Боржники"
                unCheckedChildren="Всі"
                onChange={(checked) => {
                  if (checked) {
                    setFilters((prev) => ({
                      company: debtorCompanies?.map(
                        (company) => company.companyId
                      ),
                    }))
                  } else {
                    setFilters(undefined)
                  }
                }}
              />
            ),
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
        debtorCompanies,
        isUser,
        isSingleCompanyByData,
        customServices: filteredCustomServices,
      })}
      dataSource={realEstates?.data}
      scroll={{ x: tableWidth }}
      onChange={(__, tableFilters) => {
        const newFilters: any = {
          domain: tableFilters?.domain,
          street: tableFilters?.street,
          services: filters?.services,
        }

        if (!isSingleCompanyByData) {
          newFilters.company = tableFilters?.companyName
        }

        setFilters(newFilters)
      }}
    />
  )
}

const renderTooltip = (text?: string) => {
  const value = (text ?? '').trim()

  return (
    <Tooltip title={value || null} placement="top">
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
  debtorCompanies,
  isUser,
  isSingleCompanyByData,
  customServices,
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
  setRealEstateActions: React.Dispatch<React.SetStateAction<{ edit: boolean }>>
  debtorCompanies?: CompanyWithPayments[]
  isUser?: boolean
  isSingleCompanyByData?: boolean
  customServices?: { _id: string; name: string }[]
}): ColumnType<any>[] => {
  const isOnPage = pathname === AppRoutes.REAL_ESTATE

  const selectedServices: string[] = filters?.services || []
  const showAllServices = selectedServices.length === 0

  const shouldShowService = (key: string) =>
    showAllServices || selectedServices.includes(key)

  const columns: ColumnType<any>[] = [
    {
      title: 'Адміністратори',
      dataIndex: 'adminEmails',
      width: 250,
      render: (adminEmails) => (
        <CollapsedTags items={adminEmails} maxVisible={2} />
      ),
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      width: 100,
      align: 'center',
      render: renderTooltip,
    },
    // TODO: enum
    shouldShowService('totalArea') && {
      title: 'Площа (м²)',
      dataIndex: 'totalArea',
      width: 120,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.totalArea - b.totalArea : null,
    },
    shouldShowService('pricePerMeter') && {
      title: 'Ціна (грн/м²)',
      dataIndex: 'pricePerMeter',
      width: 120,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.pricePerMeter - b.pricePerMeter : null,
      render: (value) => (
        <span className={s.currency}>{renderPrice(value)}</span>
      ),
    },
    shouldShowService('servicePricePerMeter') && {
      title: 'Індивідуальне утримання (грн/м²)',
      dataIndex: 'servicePricePerMeter',
      width: 200,
      align: 'center',
      sorter: isOnPage
        ? (a, b) => a.servicePricePerMeter - b.servicePricePerMeter
        : null,
      render: (value) =>
        value !== null && value !== undefined && value !== 0 ? (
          renderCurrency(value)
        ) : (
          <span className={s.currency}>-</span>
        ),
    },
    shouldShowService('rentPart') && {
      title: 'Частка загальної площі',
      dataIndex: 'rentPart',
      width: 180,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.rentPart - b.rentPart : null,
    },
    shouldShowService('waterPart') && {
      title: 'Частка водопостачання',
      dataIndex: 'waterPart',
      width: 180,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.waterPart - b.waterPart : null,
    },
    shouldShowService('cleaning') && {
      title: 'Прибирання (грн)',
      dataIndex: 'cleaning',
      width: 150,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.cleaning - b.cleaning : null,
      render: (value) =>
        value !== null && value !== undefined && value !== 0 ? (
          renderCurrency(value)
        ) : (
          <span className={s.currency}>-</span>
        ),
    },
    shouldShowService('discount') && {
      title: 'Знижка',
      dataIndex: 'discount',
      width: 150,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.discount - b.discount : null,
      render: (value) =>
        value !== null && value !== undefined && value !== 0 ? (
          renderCurrency(value)
        ) : (
          <span className={s.currency}>-</span>
        ),
    },
    shouldShowService('garbageCollector') && {
      align: 'center',
      title: 'Вивіз сміття',
      dataIndex: 'garbageCollector',
      width: 150,
      render: (value) => <Checkbox checked={value} disabled />,
    },
    shouldShowService('inflicion') && {
      align: 'center',
      title: 'Нарахування інд. інф.',
      dataIndex: 'inflicion',
      width: 170,
      render: (value) => <Checkbox checked={value} disabled />,
    },
  ].filter(Boolean) as ColumnType<any>[]

  if (customServices?.length) {
    customServices.forEach((custom) => {
      if (!showAllServices && !selectedServices.includes(custom._id)) return

      columns.push({
        title: custom.name,
        dataIndex: custom._id,
        width: 150,
        align: 'center',
        ellipsis: true,
        render: (_, record: IExtendedRealestate) => {
          const match = (record as any).individualServices?.find(
            (s) => String(s._id) === String(custom._id)
          )
          return match ? (
            renderCurrency(match.price)
          ) : (
            <span className={s.currency}>-</span>
          )
        },
      })
    })
  }

  if (isAdmin) {
    columns.push({
      fixed: 'right',
      align: 'center',
      title: '',
      width: 56,
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
    fixed: 'left',
    title: 'Назва компанії',
    dataIndex: 'companyName',
    width: 200,
    filterSearch: true,
    render: (i: string) => {
      if (isUser || !debtorCompanies) return i
      const debtor = debtorCompanies?.find(
        (companie) => companie?.companyName === i
      )

      if (!debtor) return i

      const tooltipDebtor = (
        <div>
          <p>
            <b>Компанія боржник</b>
          </p>
          <p>Назва компанії: {i}</p>
          <p>Сума боргу: {formatDebt(debtor.totalDebt)}</p>
        </div>
      )

      return (
        <Badge
          count={formatDebt(debtor.totalDebt)}
          title=""
          color={getDebtorTooltipColor(debtor)}
          overflowCount={Infinity}
          style={{ cursor: 'pointer' }}
          size="small"
          offset={[3, -8]}
        >
          <Tooltip title={tooltipDebtor}>
            <span style={{ cursor: 'pointer' }}>{i}</span>
          </Tooltip>
        </Badge>
      )
    },
  }
  const companyColumn: any = {
    title: 'Надавач послуг',
    dataIndex: 'domain',
    width: 200,
    render: (i) => i?.name,
    hidden: domainsFilter?.length <= 1,
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
    if (!isSingleCompanyByData) {
      domainColumn.filters =
        pathname === AppRoutes.REAL_ESTATE ? realEstatesFilter : null
      domainColumn.filteredValue = filters?.company || null
    }
    companyColumn.filters =
      pathname === AppRoutes.REAL_ESTATE ? domainsFilter : null
    companyColumn.filteredValue = filters?.domain || null
    streetColumn.filters =
      pathname === AppRoutes.REAL_ESTATE ? streetsFilter : null
    streetColumn.filteredValue = filters?.street || null
  }

  columns.unshift(streetColumn)
  columns.unshift(companyColumn)

  if (!isSingleCompanyByData) {
    columns.unshift(domainColumn)
  }

  return columns
}

export default CompaniesTable
