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
import { formatDebt, isAdminCheck, renderCurrency, renderPrice } from '@utils/helpers'
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
  Select,
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
    domains: filters?.domain,
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
  const dataSource = useMemo(() => {
  const rawData = realEstates?.data || []
  if (rawData.length === 0) return []

  const data = [...rawData]

  data.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''))

  return data
}, [realEstates?.data])


  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isUser = userResponse?.roles?.includes(Roles.USER)
  const isAdmin = isAdminCheck(userResponse?.roles)

  const tableWidth =
    1800 +
    (isGlobalAdmin ? 50 : 0) +
    (!domainId && !streetId && !isLoading ? 400 : 0)

  const isSingleCompanyByData = useMemo(() => {
    if (!realEstates?.data || realEstates.data.length === 0) return false
    const uniqueCompanies = new Set(
      realEstates.data.map((item) => item.companyName)
    )
    return uniqueCompanies.size === 1
  }, [realEstates?.data])

  const filteredCustomServices = useMemo(() => {
    return customServices?.filter((custom) => {
      const isStandardName = STANDARD_SERVICE_NAMES.includes(custom.name)
      return !isStandardName
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
      dataSource={dataSource}
      scroll={{ x: tableWidth }}
      onChange={(__, filters) => {
        const newFilters: any = {
          domain: filters?.domain,
          street: filters?.street,
        }

        if (!isSingleCompanyByData) {
          newFilters.company = filters?.companyName
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
  setRealEstateActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
  debtorCompanies?: CompanyWithPayments[]
  isUser?: boolean
  isSingleCompanyByData?: boolean
  customServices?: { _id: string; name: string; fieldName?: string }[]
}): ColumnType<any>[] => {
  const isOnPage = pathname === AppRoutes.REAL_ESTATE
  const selectedServices = filters?.services || []

  const serviceColumnsMap: Record<string, ColumnType<any>> = {
    totalArea: {
      title: 'Площа (м²)',
      dataIndex: 'totalArea',
      width: 120,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.totalArea - b.totalArea : null,
    },
    pricePerMeter: {
      title: 'Ціна (грн/м²)',
      dataIndex: 'pricePerMeter',
      width: 120,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.pricePerMeter - b.pricePerMeter : null,
      render: (value) => <span className={s.currency}>{renderPrice(value)}</span>
    },
    servicePricePerMeter: {
      title: 'Індивідуальне утримання (грн/м²)',
      dataIndex: 'servicePricePerMeter',
      width: 200,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.servicePricePerMeter - b.servicePricePerMeter : null,
      render: (value) => value ? renderCurrency(value) : <span className={s.currency}>-</span>,
    },
    rentPart: {
      title: 'Частка загальної площі',
      dataIndex: 'rentPart',
      width: 180,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.rentPart - b.rentPart : null,
    },
    waterPart: {
      title: 'Частка водопостачання',
      dataIndex: 'waterPart',
      width: 180,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.waterPart - b.waterPart : null,
    },
    cleaning: {
      title: 'Прибирання (грн)',
      dataIndex: 'cleaning',
      width: 150,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.cleaning - b.cleaning : null,
      render: (value) => value ? renderCurrency(value) : <span className={s.currency}>-</span>,
    },
    discount: {
      title: 'Знижка',
      dataIndex: 'discount',
      width: 150,
      align: 'center',
      sorter: isOnPage ? (a, b) => a.discount - b.discount : null,
      render: (value) => value ? renderCurrency(value) : <span className={s.currency}>-</span>,
    },
    garbageCollector: {
      align: 'center',
      title: 'Вивіз сміття',
      dataIndex: 'garbageCollector',
      width: 150,
      render: (value) => <Checkbox checked={value} disabled />,
    },
    inflicion: {
      align: 'center',
      title: 'Нарахування інд. інф.',
      dataIndex: 'inflicion',
      width: 170,
      render: (value) => <Checkbox checked={value} disabled />,
    },
  }

  const showAll = selectedServices.length === 0
  const keysToRender = showAll ? Object.keys(serviceColumnsMap) : selectedServices

  const resultColumns: ColumnType<any>[] = [
    {
      title: 'Адміністратори',
      dataIndex: 'adminEmails',
      width: 250,
      render: (adminEmails) => <CollapsedTags items={adminEmails} maxVisible={2} />,
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      width: 100,
      align: 'center',
      render: renderTooltip,
    },
  ]

  keysToRender.forEach((key) => {
    if (serviceColumnsMap[key]) {
      resultColumns.push(serviceColumnsMap[key])
    }
  })

  if (customServices?.length) {
    customServices.forEach((custom) => {
      const isSelected = selectedServices.includes(custom._id) || selectedServices.includes(custom.fieldName)
      if (showAll || isSelected) {
        resultColumns.push({
          title: custom.name,
          dataIndex: custom._id,
          width: 150,
          align: 'center',
          ellipsis: true,
          render: (_, record: IExtendedRealestate) => {
            const match = (record as any).individualServices?.find(
              (s: any) => String(s._id) === String(custom._id)
            )
            return match ? renderCurrency(match.price) : <span className={s.currency}>-</span>
          },
        })
      }
    })
  }

  if (isAdmin) {
    resultColumns.push({
      fixed: 'right', align: 'center', title: '', width: 56,
      render: (_, realEstate: IExtendedRealestate) => (
        <Button icon={<EditOutlined />} type="link" onClick={() => {
            setCurrentRealEstate(realEstate)
            setRealEstateActions({ edit: true })
        }} />
      ),
    })

    resultColumns.push({
      align: 'center', fixed: 'right', title: '', width: 98,
      render: (_, realEstate: IExtendedRealestate) => (
        <Dropdown menu={{
            items: [
              {
                key: 'archive',
                label: (
                  <Popconfirm title={`Ви впевнені?`} onConfirm={() => handleArchive(realEstate?._id, !realEstate.archived)}>
                    <Button type="text" icon={<InboxOutlined />} style={{ color: realEstate.archived ? '#722ed1' : '#ff4d4f', padding: '0 10px' }}>
                      {realEstate.archived ? 'Розархівувати' : 'Архівувати'}
                    </Button>
                  </Popconfirm>
                ),
              },
              isGlobalAdmin && {
                key: 'delete',
                label: (
                  <Popconfirm title="Видалити нерухомість?" onConfirm={() => handleDelete(realEstate?._id)}>
                    <Button type="text" icon={<DeleteOutlined />} style={{ color: '#ff4d4f', padding: '0 10px' }}>Видалити</Button>
                  </Popconfirm>
                ),
              },
            ].filter(Boolean) as any,
          }}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    })
  }

  const streetColumn: any = {
    title: 'Адреса', dataIndex: 'street', width: 200,
    render: (i: any) => `${i?.address} (м. ${i?.city})`,
  }

  const domainColumn: any = {
    title: 'Надавач послуг', dataIndex: 'domain', width: 200,
    render: (i: any) => i?.name,
    hidden: domainsFilter?.length <= 1,
  }

  const companyColumn: any = {
    fixed: 'left', title: 'Назва компанії', dataIndex: 'companyName', width: 200,
    render: (name: string) => {
      const debtor = debtorCompanies?.find((c) => c.companyName === name)
      if (isUser || !debtor) return name
      return (
        <Badge count={formatDebt(debtor.totalDebt)} color={getDebtorTooltipColor(debtor)} size="small" offset={[3, -8]}>
          <Tooltip title="Компанія боржник"><span style={{ cursor: 'pointer', fontWeight: 500 }}>{name}</span></Tooltip>
        </Badge>
      )
    },
  }

  if (isAdmin) {
    if (!isSingleCompanyByData) {
      companyColumn.filters = isOnPage ? realEstatesFilter : null
      companyColumn.filteredValue = filters?.company || null
    }
    domainColumn.filters = isOnPage ? domainsFilter : null
    domainColumn.filteredValue = filters?.domain || null
    streetColumn.filters = isOnPage ? streetsFilter : null
    streetColumn.filteredValue = filters?.street || null
  }

  resultColumns.unshift(streetColumn)
  resultColumns.unshift(domainColumn)
  if (!isSingleCompanyByData) resultColumns.unshift(companyColumn)

  return resultColumns
}

export default CompaniesTable