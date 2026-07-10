import React, { useMemo, useState, useEffect } from 'react'
import {
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilterOutlined,
  PlusOutlined,
  SelectOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  ImportOutlined,
  MoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import {
  useDeleteMultiplePaymentsMutation,
  useHtmlToPdfZipMutation,
  useGenerateExcelMutation,
} from '@common/api/paymentApi/payment.api'
import HeadlessReceiptRenderer from '@components/Forms/GroupedReceiptForm/HeadlessReceiptRenderer'
import dayjs from 'dayjs'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddPaymentModal from '@components/AddPaymentModal'
import ImportInvoices from '@components/UI/PaymentCardHeader/ImportInvoices'
import { AppRoutes, Operations, Roles, ServiceName } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import {
  Button,
  Checkbox,
  Flex,
  Select,
  SelectProps,
  Typography,
  message,
  Tooltip,
  Modal,
  Divider,
  theme,
  Drawer,
  Grid,
  Dropdown,
  MenuProps,
} from 'antd'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/router'
import { shouldOpenModal } from '@utils/shouldOpenModal'
import PaymentCardLabel from './PaymentCardLabel'
import styles from './styles.module.scss'
import ImportInvoicesModal from './ImportInvoices/ImportInvoicesModal'
import {
  resolvePreselectedCompany,
  resolvePreselectedDomain,
} from './preselect'
const { useBreakpoint } = Grid
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import {
  ICustomServiceItem,
  extractDomainsFromRealEstates,
  getVisibleServices,
} from '@utils/servicesVisibility'

export interface PaymentCardHeaderProps {
  onDeleteClick?: () => void
  setCurrentDateFilter: (val: any) => void
  currentPayment: any
  paymentActions: { edit: boolean; preview: boolean }
  closeEditModal: () => void
  paymentsDeleteItems: any[]
  payments: any
  streets: any
  filters: any
  setFilters: (filters: any) => void
  selectedPayments: any[]
  setPaymentsDeleteItems: (items: any[]) => void
  setSelectedPayments: (payments: any[]) => void
  enablePaymentsButton: boolean
  onColumnsSelect: (selected: string[]) => void
  domainFilter?: any
  realEstatesFilter?: any
  singleCompany?: string
  singleDomain?: string
  isDashboard?: boolean
  onBulkMarkPaid?: (payments: IExtendedPayment[]) => void
  onBulkDuplicate?: (payments: IExtendedPayment[]) => void
  onRefresh?: () => void | Promise<unknown>
  isRefreshing?: boolean
}

const PaymentCardHeader: React.FC<PaymentCardHeaderProps> = ({
  setCurrentDateFilter,
  currentPayment,
  paymentActions,
  closeEditModal,
  paymentsDeleteItems,
  payments,
  streets,
  filters,
  setFilters,
  selectedPayments,
  setPaymentsDeleteItems,
  setSelectedPayments,
  enablePaymentsButton,
  onColumnsSelect,
  domainFilter,
  realEstatesFilter,
  singleCompany,
  singleDomain,
  isDashboard,
  onDeleteClick,
  onBulkMarkPaid,
  onBulkDuplicate,
  onRefresh,
  isRefreshing,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const screens = useBreakpoint()

  const { data: currUser } = useGetCurrentUserQuery()
  const { data: customServicesData } = useGetCustomServicesQuery({})
  const allCustomServices = useMemo(
    () => (customServicesData?.data ?? []) as ICustomServiceItem[],
    [customServicesData?.data]
  )
  const { pathname } = router

  const closeModal = () => {
    setIsModalOpen(false)
    closeEditModal()
  }

  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isAdmin = isAdminCheck(currUser?.roles)
  const [deletePayment] = useDeleteMultiplePaymentsMutation()
  const [generateExcel] = useGenerateExcelMutation()
  const [htmlToPdfZip] = useHtmlToPdfZipMutation()
  const [bulkPaymentsToRender, setBulkPaymentsToRender] = useState<
    IExtendedPayment[]
  >([])
  const capturedHtmlMapRef = React.useRef<
    Map<string, { html: string; fileName: string }>
  >(new Map())
  const { token } = theme.useToken()

  const buildBulkFileName = (payment: IExtendedPayment): string => {
    const companyName = (payment as any)?.reciever?.companyName ?? 'invoice'
    const datePrefix = dayjs((payment as any)?.invoiceCreationDate).isValid()
      ? dayjs((payment as any)?.invoiceCreationDate).format('DDMMYY')
      : ''
    const slug = `${datePrefix}${(payment as any)?.invoiceNumber ?? ''}`
    return `${companyName}-inv-${slug}`.trim()
  }

  const finalizeBulkPdf = async (
    items: { html: string; fileName: string }[]
  ) => {
    try {
      const response = await htmlToPdfZip({ items })
      if ('data' in response) {
        const { data } = response
        if (data) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          const buffer = Buffer.from(data.buffer)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          const blob = new Blob([buffer], {
            type: `application/${data.fileExtension}`,
          })
          saveAs(blob, `${data.fileName}.${data.fileExtension}`)
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('htmlToPdfZip failed:', response.error)
        const serverMsg = (response.error as { data?: { error?: string } })
          ?.data?.error
        message.error(
          serverMsg
            ? `PDF: ${serverMsg}`
            : 'Сталася помилка під час генерації PDF'
        )
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('htmlToPdfZip threw:', error)
      message.error(
        `PDF: ${(error as Error)?.message ?? 'несподівана помилка'}`
      )
    } finally {
      capturedHtmlMapRef.current = new Map()
      setBulkPaymentsToRender([])
    }
  }

  const handleBulkCapture = (
    paymentId: string,
    fileName: string,
    html: string
  ) => {
    capturedHtmlMapRef.current.set(paymentId, { html, fileName })
    if (capturedHtmlMapRef.current.size === bulkPaymentsToRender.length) {
      const items = bulkPaymentsToRender.map((p) => {
        const cached = capturedHtmlMapRef.current.get(p._id)
        return cached || { html: '', fileName: buildBulkFileName(p) }
      })
      finalizeBulkPdf(items)
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await generateExcel({ payments: selectedPayments })
      const blob = new Blob([new Uint8Array(response.data.buffer?.data)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, `payments.xlsx`)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleGeneratePdf = () => {
    if (!selectedPayments || selectedPayments.length === 0) return
    capturedHtmlMapRef.current = new Map()
    setBulkPaymentsToRender(selectedPayments as IExtendedPayment[])
  }

  const handleRefresh = async () => {
    if (!onRefresh) return
    const key = 'payments-refresh'
    message.loading({ content: 'Оновлення даних...', key })
    try {
      await onRefresh()
      message.success({ content: 'Дані оновлено', key })
    } catch {
      message.error({ content: 'Не вдалося оновити дані', key })
    }
  }

  const menuActions: Record<string, () => void> = {
    refresh: handleRefresh,
    export: handleExportExcel,
    import: () => setIsImportModalOpen(true),
    invoices: () => router.push(AppRoutes.PAYMENT_BULK),
    add: () => setIsModalOpen(true),
    download: handleGeneratePdf,
    delete: onDeleteClick,
    bulkMarkPaid: () =>
      onBulkMarkPaid?.(selectedPayments as IExtendedPayment[]),
    bulkDuplicate: () =>
      onBulkDuplicate?.(selectedPayments as IExtendedPayment[]),
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) =>
    menuActions[key]?.()

  const selectedCompany = useMemo(
    () => resolvePreselectedCompany(filters?.company, realEstatesFilter),
    [filters?.company, realEstatesFilter]
  )

  const selectedDomain = useMemo(
    () => resolvePreselectedDomain(filters?.domain, domainFilter),
    [filters?.domain, domainFilter]
  )

  const infoTooltip = useMemo(() => {
    const texts: string[] = []
    if (singleDomain) texts.push(`Надавач послуг: ${singleDomain}`)
    if (singleCompany) texts.push(`Компанія: ${singleCompany}`)
    return texts.join('\n')
  }, [singleDomain, singleCompany])

  const canBulkMarkPaid = useMemo(
    () =>
      selectedPayments.length >= 1 &&
      selectedPayments.every(
        (payment: IExtendedPayment) => payment.type === Operations.Debit
      ),
    [selectedPayments]
  )

  const allowedServices = useMemo(() => {
    if (!payments?.data?.length) return undefined
    const types = new Set<string>()
    payments.data.forEach((payment: IExtendedPayment) => {
      payment.invoice?.forEach((field) => {
        if (field.type) types.add(field.type)
        if (field.serviceId) types.add(String(field.serviceId))
        if (field.type === 'custom' && !field.serviceId && field.name) {
          types.add(field.name)
        }
      })
    })
    return types
  }, [payments])

  const visibleDomains = useMemo(
    () =>
      extractDomainsFromRealEstates(
        payments?.data?.map((payment: IExtendedPayment) => ({
          domain: payment.domain,
        })) ?? []
      ),
    [payments?.data]
  )

  const visibleCustomServices = useMemo(
    () =>
      getVisibleServices(
        currUser?.roles ?? [],
        visibleDomains,
        allCustomServices
      ),
    [currUser?.roles, visibleDomains, allCustomServices]
  )

  const invoiceCustomServices = useMemo(() => {
    const map = new Map<string, InvoiceCustomEntry>()

    const visibleIds = new Set(
      visibleCustomServices.map((service) => String(service._id))
    )

    payments?.data?.forEach((payment) => {
      payment.invoice?.forEach((field) => {
        if (field.type !== 'custom' || !field.name) return

        if (!field.serviceId) {
          map.set(field.name, {
            value: field.name,
            label: field.name,
          })
          return
        }

        const serviceId = String(field.serviceId)

        if (!visibleIds.has(serviceId)) {
          map.set(serviceId, {
            value: serviceId,
            label: field.name,
          })
        }
      })
    })

    return [...map.values()]
  }, [payments, visibleCustomServices])
  const { preview, edit } = paymentActions

  if (!isAdmin && !isGlobalAdmin) {
    return (
      <>
        <div style={{ marginBottom: '10px', marginTop: '10px' }}>
          <PaymentCardLabel
            enablePaymentsButton={enablePaymentsButton}
            onColumnsSelect={onColumnsSelect}
            setCurrentDateFilter={setCurrentDateFilter}
            setFilters={setFilters}
            streets={streets}
            filters={filters}
            domainFilter={domainFilter}
            realEstatesFilter={realEstatesFilter}
            isAdmin={false}
            visibleCustomServices={visibleCustomServices}
            invoiceCustomServices={invoiceCustomServices}
          />
        </div>
        {preview && currentPayment && (
          <AddPaymentModal
            paymentActions={{ preview: true, edit: false }}
            paymentData={currentPayment}
            closeModal={closeEditModal}
          />
        )}
      </>
    )
  }

  const items: MenuProps['items'] = [
    ...(infoTooltip
      ? [
          {
            key: 'info',
            label: infoTooltip,
            icon: <InfoCircleOutlined />,
            disabled: true,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            key: 'refresh',
            label: 'Оновити',
            icon: <ReloadOutlined spin={isRefreshing} />,
          },
        ]
      : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0
      ? [{ key: 'export', label: 'Export to Excel', icon: <ExportOutlined /> }]
      : []),
    ...(isAdmin
      ? [{ key: 'import', label: 'Імпорт', icon: <ImportOutlined /> }]
      : []),
    ...(isAdmin
      ? [{ key: 'invoices', label: 'Інвойси', icon: <SelectOutlined /> }]
      : []),
    ...(isAdmin
      ? [{ key: 'add', label: 'Додати', icon: <PlusOutlined /> }]
      : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0
      ? [
          {
            key: 'download',
            label: 'Завантажити рахунки',
            icon: <DownloadOutlined />,
          },
        ]
      : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && canBulkMarkPaid
      ? [
          {
            key: 'bulkMarkPaid',
            label: 'Позначити оплати',
            icon: <CheckOutlined />,
          },
        ]
      : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0
      ? [
          {
            key: 'bulkDuplicate',
            label: 'Дублювати рахунки',
            icon: <CopyOutlined />,
          },
        ]
      : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0
      ? [
          {
            key: 'delete',
            label: 'Видалити',
            icon: <DeleteOutlined />,
            danger: true,
          },
        ]
      : []),
  ]

  const dashboardItems: MenuProps['items'] = [
    {
      key: 'refresh',
      label: 'Оновити',
      icon: <ReloadOutlined spin={isRefreshing} />,
    },
    { key: 'import', label: 'Імпорт', icon: <ImportOutlined /> },
    { key: 'invoices', label: 'Інвойси', icon: <SelectOutlined /> },
    { key: 'add', label: 'Додати', icon: <PlusOutlined /> },
  ]

  if (isDashboard) {
    return (
      <>
        <Flex
          justify="space-between"
          align="center"
          style={{ margin: 0, width: '100%' }}
        >
          <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT)}>
            Платежі
            <SelectOutlined />
          </Button>
          <Dropdown
            menu={{ items: dashboardItems, onClick: handleMenuClick }}
            trigger={['click']}
            placement="bottomRight"
            overlayStyle={{ minWidth: 190 }}
          >
            <Tooltip title="Додаткові дії">
              <Button
                type="text"
                icon={
                  <MoreOutlined
                    style={{ color: token.colorText, fontSize: 18 }}
                  />
                }
                style={{
                  padding: 8,
                  minWidth: 40,
                  minHeight: 40,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 8,
                }}
              />
            </Tooltip>
          </Dropdown>
        </Flex>
        {shouldOpenModal(isModalOpen, currentPayment, paymentActions) && (
          <AddPaymentModal
            paymentActions={
              !isAdmin ? { edit: false, preview: true } : paymentActions
            }
            paymentData={currentPayment}
            preselectedCompany={selectedCompany}
            preselectedDomain={selectedDomain}
            closeModal={closeModal}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 10, marginTop: 10, width: '100%' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <PaymentCardLabel
            enablePaymentsButton={enablePaymentsButton}
            onColumnsSelect={onColumnsSelect}
            setCurrentDateFilter={setCurrentDateFilter}
            setFilters={setFilters}
            streets={streets}
            filters={filters}
            domainFilter={domainFilter}
            realEstatesFilter={realEstatesFilter}
            isAdmin={isAdmin}
            className={styles.select}
            allowedServices={allowedServices}
            visibleCustomServices={visibleCustomServices}
            invoiceCustomServices={invoiceCustomServices}
          />
        </div>
        <div style={{ marginLeft: 12 }}>
          <Dropdown
            menu={{ items, onClick: handleMenuClick }}
            trigger={['click']}
            placement="bottomRight"
            overlayStyle={{ minWidth: 190 }}
          >
            <Tooltip title="Додаткові дії">
              <Button
                type="text"
                icon={
                  <MoreOutlined
                    style={{ color: token.colorText, fontSize: 18 }}
                  />
                }
                style={{
                  padding: 8,
                  minWidth: 40,
                  minHeight: 40,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 8,
                }}
              />
            </Tooltip>
          </Dropdown>
        </div>
      </Flex>
      {shouldOpenModal(isModalOpen, currentPayment, paymentActions) && (
        <AddPaymentModal
          paymentActions={
            !isAdmin ? { edit: false, preview: true } : paymentActions
          }
          paymentData={currentPayment}
          preselectedCompany={selectedCompany}
          preselectedDomain={selectedDomain}
          closeModal={closeModal}
        />
      )}
      {isImportModalOpen && (
        <ImportInvoicesModal closeModal={() => setIsImportModalOpen(false)} />
      )}
      {bulkPaymentsToRender.map((p) => (
        <HeadlessReceiptRenderer
          key={p._id}
          payment={p}
          onCapture={(html) =>
            handleBulkCapture(p._id, buildBulkFileName(p), html)
          }
          onError={(err) => {
            // eslint-disable-next-line no-console
            console.error('Bulk render failed for', p._id, err)
            handleBulkCapture(p._id, buildBulkFileName(p), '')
          }}
        />
      ))}
    </>
  )
}

interface ColumnSelectProps {
  onSelect?: (selected: string[]) => void
  style?: React.CSSProperties
  className?: string
  allowedServices?: Set<string>
  visibleCustomServices?: ICustomServiceItem[]
  invoiceCustomServices?: InvoiceCustomEntry[]
}

interface InvoiceCustomEntry {
  value: string
  label: string
}

const ColumnSelect: React.FC<ColumnSelectProps> = ({
  onSelect,
  allowedServices,
  visibleCustomServices,
  invoiceCustomServices = [],
  ...props
}) => {
  const [selected, setSelected] = useState<string[]>([])
  const [filterByAvailable, setFilterByAvailable] = useState(true)
  const isInitialized = React.useRef(false)

  const customIds = useMemo(() => {
    return new Set((visibleCustomServices ?? []).map((s) => String(s._id)))
  }, [visibleCustomServices])

  const filteredEntries = useMemo(() => {
    return Object.entries(ServiceName).filter(([value]) => {
      if (!filterByAvailable || !allowedServices) return true
      return allowedServices.has(value)
    })
  }, [filterByAvailable, allowedServices])

  const customEntries = useMemo(() => {
    const entries = [
      ...(visibleCustomServices ?? []).map((s) => ({
        value: String(s._id),
        label: s.name,
      })),
      ...invoiceCustomServices,
    ]

    if (!filterByAvailable || !allowedServices) {
      return entries
    }

    return entries.filter(
      (e) => allowedServices.has(e.value) || allowedServices.has('custom')
    )
  }, [
    filterByAvailable,
    allowedServices,
    visibleCustomServices,
    invoiceCustomServices,
  ])

  const handleSelect = (value: string[]) => {
    setSelected(value)
    localStorage.setItem('payments_columns', JSON.stringify(value))
  }

  const handleCheckAll = () => {
    const allFiltered = [
      ...filteredEntries.map(([value]) => value),
      ...customEntries.map((e) => e.value),
    ]
    if (
      selected.length === allFiltered.length &&
      allFiltered.every((v) => selected.includes(v))
    ) {
      setSelected([])
      localStorage.setItem('payments_columns', JSON.stringify([]))
    } else {
      setSelected(allFiltered)
      localStorage.setItem('payments_columns', JSON.stringify(allFiltered))
    }
  }

  useEffect(() => {
    if (!allowedServices) return

    let saved = JSON.parse(localStorage.getItem('payments_columns') ?? '[]')

    if (filterByAvailable) {
      const filtered = saved.filter((s: string) => allowedServices.has(s))

      if (filtered.length !== saved.length) {
        saved = filtered
      }
    }

    if (!saved.includes('placingPrice')) {
      saved.push('placingPrice')
    }

    if (!isInitialized.current) {
      if (saved.length <= 1) {
        const builtIn = Object.entries(ServiceName)
          .filter(([value]) => value !== 'custom' && allowedServices.has(value))
          .map(([value]) => value)

        const customs = customEntries
          .map((s) => s.value)
          .filter(
            (id) => allowedServices.has(id) || allowedServices.has('custom')
          )

        saved = [...new Set([...saved, ...builtIn, ...customs])]
      }
      isInitialized.current = true
    } else if (filterByAvailable) {
      saved = saved.filter((s: string) => {
        if (allowedServices.has(s) || s === 'placingPrice' || s === 'custom') {
          return true
        }
        if (customIds.has(s) && allowedServices.has('custom')) {
          return true
        }
        return false
      })
    }

    setSelected(saved)
    localStorage.setItem('payments_columns', JSON.stringify(saved))
  }, [allowedServices, filterByAvailable, customEntries, customIds])

  useEffect(() => {
    if (!allowedServices || !filterByAvailable) return

    const saved = JSON.parse(localStorage.getItem('payments_columns') ?? '[]')

    if (saved.length > 0) return

    const builtIn = Object.entries(ServiceName)
      .filter(([value]) => value !== 'custom' && allowedServices.has(value))
      .map(([value]) => value)

    const customs = customEntries
      .map((s) => s.value)
      .filter((id) => allowedServices.has(id) || allowedServices.has('custom'))

    const allAvailable = [...builtIn, ...customs]

    setSelected(allAvailable)
    localStorage.setItem('payments_columns', JSON.stringify(allAvailable))
  }, [allowedServices, filterByAvailable, customEntries])

  useEffect(() => {
    onSelect?.(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const allFiltered = [
    ...filteredEntries.map(([value]) => value),
    ...customEntries.map((e) => e.value),
  ]
  const isAllChecked =
    allFiltered.length > 0 && allFiltered.every((v) => selected.includes(v))

  const isIndeterminate =
    selected.some((s) => allFiltered.includes(s)) && !isAllChecked

  const options: SelectProps['options'] = [
    {
      label: (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={filterByAvailable}
            onChange={(e) => setFilterByAvailable(e.target.checked)}
          >
            <Typography.Text type="secondary">Доступні сервіси</Typography.Text>
          </Checkbox>
          <Divider style={{ margin: '4px 0' }} />
          <Checkbox
            onChange={handleCheckAll}
            indeterminate={isIndeterminate}
            checked={isAllChecked}
          >
            <Typography.Text type="secondary">Послуги</Typography.Text>
          </Checkbox>
        </div>
      ),
      options: [
        ...filteredEntries.map(([value, label]) => ({ value, label })),
        ...customEntries,
      ],
    },
  ]

  return (
    <Select
      mode="multiple"
      placeholder="Оберіть послуги"
      value={selected}
      onChange={handleSelect}
      options={options}
      maxTagCount={1}
      allowClear
      showSearch
      optionFilterProp="label"
      suffixIcon={<FilterOutlined />}
      {...props}
    />
  )
}

export { ColumnSelect }
export default PaymentCardHeader
