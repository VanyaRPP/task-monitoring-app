import React, { useMemo, useState, useEffect } from 'react'
import {
  CheckOutlined,
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
} from '@ant-design/icons'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import {
  useDeleteMultiplePaymentsMutation,
  useGeneratePdfMutation,
  useGenerateExcelMutation,
} from '@common/api/paymentApi/payment.api'
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
import { resolvePreselectedCompany, resolvePreselectedDomain } from './preselect'
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
  const [generatePdf] = useGeneratePdfMutation()
  const { token } = theme.useToken()

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

 

  const handleGeneratePdf = async () => {
    try {
      const response = await generatePdf({ payments: selectedPayments })
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
        // TEMP: surface real server error to debug PDF generation issue.
        // eslint-disable-next-line no-console
        console.error('generatePdf failed:', response.error)
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
      console.error('generatePdf threw:', error)
      message.error(
        `PDF: ${(error as Error)?.message ?? 'несподівана помилка'}`
      )
    }
  }

  const menuActions: Record<string, () => void> = {
    export:       handleExportExcel,
    import:       () => setIsImportModalOpen(true),
    invoices:     () => router.push(AppRoutes.PAYMENT_BULK),
    add:          () => setIsModalOpen(true),
    download:     handleGeneratePdf,
    delete:       onDeleteClick,
    bulkMarkPaid: () => onBulkMarkPaid?.(selectedPayments as IExtendedPayment[]),
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => menuActions[key]?.()

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
      })
    })
    return types
  }, [payments])

  const visibleDomains = useMemo(
    () => extractDomainsFromRealEstates(
      payments?.data?.map((p) => ({ domain: p.domain })) ?? []
    ),
    [payments?.data]
  )

  const visibleCustomServices = useMemo(
    () => getVisibleServices(currUser?.roles, visibleDomains, allCustomServices),
    [currUser?.roles, visibleDomains, allCustomServices]
  )

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
    ...(infoTooltip ? [{ key: 'info', label: infoTooltip, icon: <InfoCircleOutlined />, disabled: true }] : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0 ? [{ key: 'export', label: 'Export to Excel', icon: <ExportOutlined /> }] : []),
    ...(isAdmin ? [{ key: 'import', label: 'Імпорт', icon: <ImportOutlined /> }] : []),
    ...(isAdmin ? [{ key: 'invoices', label: 'Інвойси', icon: <SelectOutlined /> }] : []),
    ...(isAdmin ? [{ key: 'add', label: 'Додати', icon: <PlusOutlined /> }] : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0 ? [{ key: 'download', label: 'Завантажити рахунки', icon: <DownloadOutlined /> }] : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && canBulkMarkPaid ? [{ key: 'bulkMarkPaid', label: 'Позначити оплати', icon: <CheckOutlined /> }] : []),
    ...(isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0 ? [{ key: 'delete', label: 'Видалити', icon: <DeleteOutlined />, danger: true }] : []),
  ]

  const dashboardItems: MenuProps['items'] = [
    { key: 'import', label: 'Імпорт', icon: <ImportOutlined /> },
    { key: 'invoices', label: 'Інвойси', icon: <SelectOutlined /> },
    { key: 'add', label: 'Додати', icon: <PlusOutlined /> },
  ]

  if (isDashboard) {
    return (
      <>
        <Flex justify="space-between" align="center" style={{ margin: 0, width: '100%' }}>
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
                icon={<MoreOutlined style={{ color: token.colorText, fontSize: 18 }} />}
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
      <Flex justify="space-between" align="center" style={{ marginBottom: 10, marginTop: 10, width: '100%' }}>
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
                icon={<MoreOutlined style={{ color: token.colorText, fontSize: 18 }} />}
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
          paymentActions={!isAdmin ? { edit: false, preview: true } : paymentActions}
          paymentData={currentPayment}
          preselectedCompany={selectedCompany}
          preselectedDomain={selectedDomain}
          closeModal={closeModal}
        />
      )}
      {isImportModalOpen && <ImportInvoicesModal closeModal={() => setIsImportModalOpen(false)} />}
    </>
  )
}

interface ColumnSelectProps {
  onSelect?: (selected: string[]) => void
  style?: React.CSSProperties
  className?: string
  allowedServices?: Set<string>
  visibleCustomServices?: ICustomServiceItem[]
}

const ColumnSelect: React.FC<ColumnSelectProps> = ({ onSelect, allowedServices, visibleCustomServices, ...props }) => {
  const [selected, setSelected] = useState<string[]>([])
  const [filterByAvailable, setFilterByAvailable] = useState(true)

  const filteredEntries = useMemo(() => {
    return Object.entries(ServiceName).filter(([value]) => {
      if (!filterByAvailable || !allowedServices) return true
      return allowedServices.has(value)
    })
  }, [filterByAvailable, allowedServices])

  const customEntries = useMemo(
    () => (visibleCustomServices ?? []).map(s => ({ value: s._id, label: s.name })),
    [visibleCustomServices]
  )

  const handleSelect = (value: string[]) => {
    setSelected(value)
    localStorage.setItem('payments_columns', JSON.stringify(value))
  }

  const handleCheckAll = () => {
    const allFiltered = [
      ...filteredEntries.map(([value]) => value),
      ...customEntries.map(e => e.value),
    ]
    if (selected.length === allFiltered.length &&
        allFiltered.every(v => selected.includes(v))) {
      setSelected([])
      localStorage.setItem('payments_columns', JSON.stringify([]))
    } else {
      setSelected(allFiltered)
      localStorage.setItem('payments_columns', JSON.stringify(allFiltered))
    }
  }

  useEffect(() => {
    if (filterByAvailable && allowedServices) {
      const filtered = selected.filter(s => allowedServices.has(s))
      if (filtered.length !== selected.length) {
        setSelected(filtered)
        localStorage.setItem('payments_columns', JSON.stringify(filtered))
      }
    }
  }, [filterByAvailable, allowedServices])

  useEffect(() => {
    if (!allowedServices || !filterByAvailable) return

    const allAvailable = Object.entries(ServiceName)
      .filter(([value]) => allowedServices.has(value))
      .map(([value]) => value)

    setSelected(allAvailable)
    localStorage.setItem('payments_columns', JSON.stringify(allAvailable))
  }, [allowedServices, filterByAvailable])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('payments_columns') ?? '[]')
    if (!saved.includes('placingPrice')) {
      saved.push('placingPrice')
      localStorage.setItem('payments_columns', JSON.stringify(saved))
    }
    setSelected(saved)
  }, [])

  useEffect(() => {
    if (!allowedServices || !filterByAvailable) return

    const saved = JSON.parse(localStorage.getItem('payments_columns') ?? '[]')

    if (saved.length > 0) return

    const allAvailable = Object.entries(ServiceName)
      .filter(([value]) => allowedServices.has(value))
      .map(([value]) => value)

    setSelected(allAvailable)
    localStorage.setItem('payments_columns', JSON.stringify(allAvailable))
  }, [allowedServices, filterByAvailable])

  useEffect(() => {
    onSelect?.(selected)
  }, [onSelect, selected])

  const allFiltered = [
    ...filteredEntries.map(([value]) => value),
    ...customEntries.map(e => e.value),
  ]
  const isAllChecked = allFiltered.length > 0 &&
    allFiltered.every(v => selected.includes(v))
  const isIndeterminate = selected.some(s => allFiltered.includes(s)) && !isAllChecked

  const options: SelectProps['options'] = [
    {
      label: (
        <div>
          <Checkbox
            checked={filterByAvailable}
            onChange={(e) => setFilterByAvailable(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography.Text type="secondary">Доступні сервіси</Typography.Text>
          </Checkbox>
          <Divider style={{ margin: '4px 0' }} />
          <Checkbox
            onClick={(e) => {
              e.stopPropagation()
              handleCheckAll()
            }}
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
