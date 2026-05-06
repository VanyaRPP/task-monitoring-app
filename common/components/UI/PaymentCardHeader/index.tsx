import React, { useMemo, useState, useEffect } from 'react'
import {
  DeleteOutlined,
  DownloadOutlined,
  FilterOutlined,
  PlusOutlined,
  SelectOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  UpOutlined,
  MenuOutlined,
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
import { AppRoutes, Roles, ServiceName } from '@utils/constants'
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
  Collapse,
  Modal,
  Divider,
  theme,
  Drawer,
  Grid,
} from 'antd'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/router'
import { shouldOpenModal } from '@utils/shouldOpenModal'
import PaymentCardLabel from './PaymentCardLabel'
import type { CollapseProps } from 'antd'
import styles from './styles.module.scss'
import { resolvePreselectedCompany, resolvePreselectedDomain } from './preselect'
const { useBreakpoint } = Grid
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'

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
  onDeleteClick
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const screens = useBreakpoint()

  const { data: currUser } = useGetCurrentUserQuery()
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
        message.error('Сталася помилка під час генерації PDF')
      }
    } catch (error) {
      message.error('Сталася несподівана помилка під час генерації PDF')
    }
  }
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

  const panelStyle: React.CSSProperties = { border: 'none' }

  const label = (
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
    />
  )

  const getItems = (
    panelStyle: React.CSSProperties
  ): CollapseProps['items'] => [
    {
      key: '1',
      label,
      style: panelStyle,
      collapsible: 'icon',
      forceRender: true,
      children: (
        <>
          <Divider className={styles.Divider} />
          <Flex className={styles.flexButtonContainer} align="center">
            {infoTooltip && (
              <Tooltip title={infoTooltip}>
                <InfoCircleOutlined
                  style={{ marginRight: 16, color: 'rgba(0,0,0,0.45)' }}
                />
              </Tooltip>
            )}
            {isAdmin &&
              pathname === AppRoutes.PAYMENT &&
              selectedPayments.length > 0 && (
                <Button type="link" onClick={handleExportExcel}>
                  Export to Excel <ExportOutlined />
                </Button>
              )}
            {isAdmin && <ImportInvoices />}
            {isAdmin && (
              <Button
                type="link"
                onClick={() => router.push(AppRoutes.PAYMENT_BULK)}
              >
                Інвойси <SelectOutlined />
              </Button>
            )}
            {isAdmin && (
              <Button type="link" onClick={() => setIsModalOpen(true)}>
                <PlusOutlined /> Додати
              </Button>
            )}
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
            {isAdmin &&
              pathname === AppRoutes.PAYMENT &&
              selectedPayments.length > 0 && (
                <Button type="link" onClick={handleGeneratePdf}>
                  Завантажити рахунки <DownloadOutlined />
                </Button>
              )}
            {isAdmin &&
              pathname === AppRoutes.PAYMENT &&
              selectedPayments.length > 0 && (
                <Button type="link" onClick={onDeleteClick}>
                  <DeleteOutlined /> Видалити
                </Button>
              )}
          </Flex>
        </>
      ),
    },
  ]
  if (isDashboard) {
    return (
      <>
        <Flex justify="space-between" align="center" style={{ margin: 0 }}>
          <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT)}>
            Платежі
            <SelectOutlined />
          </Button>
          <Flex gap={8} wrap="wrap">
            <ImportInvoices />
            <Button
              type="link"
              icon={<SelectOutlined />}
              onClick={() => router.push(AppRoutes.PAYMENT_BULK)}
            >
              Інвойси
            </Button>
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Додати
            </Button>
          </Flex>
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
    <Collapse
      className={styles.customCollapse}
      bordered={false}
      defaultActiveKey={[]}
      expandIcon={({ isActive }) => (
        <Tooltip title="Додаткові дії">
          <UpOutlined
            rotate={isActive ? 0 : 180}
            className={styles.collapseButton}
          />
        </Tooltip>
      )}
      expandIconPosition="right"
      items={getItems(panelStyle)}
      ghost
    />
  )
}

interface ColumnSelectProps {
  onSelect?: (selected: string[]) => void
  style?: React.CSSProperties
  className?: string
  allowedServices?: Set<string>
}

const ColumnSelect: React.FC<ColumnSelectProps> = ({ onSelect, allowedServices, ...props }) => {
  const [selected, setSelected] = useState<string[]>([])
  const [filterByAvailable, setFilterByAvailable] = useState(true)

  const filteredEntries = useMemo(() => {
    return Object.entries(ServiceName).filter(([value]) => {
      if (!filterByAvailable || !allowedServices) return true
      return allowedServices.has(value)
    })
  }, [filterByAvailable, allowedServices])

  const handleSelect = (value: string[]) => {
    setSelected(value)
    localStorage.setItem('payments_columns', JSON.stringify(value))
  }

  const handleCheckAll = () => {
    const allFiltered = filteredEntries.map(([value]) => value)
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
}, [allowedServices])

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
}, [allowedServices])

  useEffect(() => {
    onSelect?.(selected)
  }, [onSelect, selected])

  const allFiltered = filteredEntries.map(([value]) => value)
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
          <Typography.Text type="secondary">Комунальні</Typography.Text>
        </Checkbox>
        </div>
      ),
      options: filteredEntries.map(([value, label]) => ({ 
        value,
        label,
      })),
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
