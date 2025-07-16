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
import PaymentCardLabel from './PaymentCardLabel';
import type { CollapseProps } from 'antd';
import styles from './styles.module.scss'
const { useBreakpoint } = Grid

export interface PaymentCardHeaderProps {
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

  const handleDeletePayments = async () => {
    Modal.confirm({
      title: 'Ви впевнені, що хочете видалити обрані проплати?',
      cancelText: 'Ні',
      okText: 'Так',
      content: (
        <>
          {paymentsDeleteItems.map((item, index) => (
            <div key={index}>
              {index + 1}. {item.domain}, {item.company},{' '}
              {dateToDefaultFormat(item.date)}
            </div>
          ))}
        </>
      ),
      onOk: async () => {
        const response = await deletePayment(
          paymentsDeleteItems.map((item) => item.id)
        )
        if ('data' in response) {
          setPaymentsDeleteItems([])
          setSelectedPayments([])
          message.success('Видалено!')
        } else {
          message.error('Помилка при видаленні рахунків')
        }
      },
    })
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

  const selectedCompany = filters?.company?.length === 1 ? filters.company[0] : undefined

  const infoTooltip = useMemo(() => {
    const texts: string[] = []
    if (singleDomain) texts.push(`Надавач послуг: ${singleDomain}`)
    if (singleCompany) texts.push(`Компанія: ${singleCompany}`)
    return texts.join('\n')
  }, [singleDomain, singleCompany])

  if (!isAdmin && !isGlobalAdmin) {
    return (
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
  />
)

const getItems = (panelStyle: React.CSSProperties): CollapseProps['items'] => [
  {
    key: '1',
    label,
    style: panelStyle,
    collapsible: 'icon',
    children: (
      <>
        <Divider className={styles.Divider}/>
        <Flex className={styles.flexButtonContainer} align="center">
          {infoTooltip && (
            <Tooltip title={infoTooltip}>
              <InfoCircleOutlined
                style={{ marginRight: 16, color: 'rgba(0,0,0,0.45)' }}
              />
            </Tooltip>
          )}
          {isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0 && (
            <Button type="link" onClick={handleExportExcel}>
              Export to Excel <ExportOutlined />
            </Button>
          )}
          {isAdmin && <ImportInvoices />}
          {isAdmin && (
            <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT_BULK)}>
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
              paymentActions={!isAdmin ? { edit: false, preview: true } : paymentActions}
              paymentData={currentPayment}
              preselectedCompany={selectedCompany}
              closeModal={closeModal}
            />
          )}
          {isAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0 && (
            <Button type="link" onClick={handleGeneratePdf}>
              Завантажити рахунки <DownloadOutlined />
            </Button>
          )}
          {isGlobalAdmin && pathname === AppRoutes.PAYMENT && selectedPayments.length > 0 && (
            <Button type="link" onClick={handleDeletePayments}>
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
        <Button
          type="link"
          onClick={() => router.push(AppRoutes.PAYMENT)}
        >
          Платежі
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
          paymentActions={!isAdmin ? { edit: false, preview: true } : paymentActions}
          paymentData={currentPayment}
          preselectedCompany={selectedCompany}
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
}

const ColumnSelect: React.FC<ColumnSelectProps> = ({ onSelect, ...props }) => {
  const [selected, setSelected] = useState<string[]>([])

  const handleSelect = (value: string[]) => {
    setSelected(value)
    localStorage.setItem('payments_columns', JSON.stringify(value))
  }

  const handleCheckAll = (index = 0) => {
    if (selected.length === Object.keys(ServiceName).length) {
      setSelected([])
      localStorage.setItem('payments_columns', JSON.stringify([]))
    } else {
      const newSelected = options[index].options?.map(({ value }) => value)
      setSelected(newSelected)
      localStorage.setItem('payments_columns', JSON.stringify(newSelected))
    }
  }

  useEffect(() => {
    setSelected(JSON.parse(localStorage.getItem('payments_columns') ?? '[]'))
  }, [])

  useEffect(() => {
    onSelect?.(selected)
  }, [onSelect, selected])

  useEffect(() => {
    const savedColumns = JSON.parse(localStorage.getItem('payments_columns') ?? '[]')

    if (!savedColumns.includes('placingPrice')) {
      savedColumns.push('placingPrice')
      localStorage.setItem('payments_columns', JSON.stringify(savedColumns))
    }

    setSelected(savedColumns)
  }, [])
  const options: SelectProps['options'] = [
    {
      label: (
        <Checkbox
          onClick={() => handleCheckAll(0)}
          indeterminate={
            selected.length > 0 &&
            selected.length < Object.keys(ServiceName).length
          }
          checked={Object.keys(ServiceName).length === selected.length}
        >
          <Typography.Text type="secondary">Комунальні</Typography.Text>
        </Checkbox>
      ),
      options: Object.entries(ServiceName).map(([value, label]) => ({
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
