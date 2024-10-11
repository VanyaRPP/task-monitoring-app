import {
  DeleteOutlined,
  DownloadOutlined,
  FilterOutlined,
  PlusOutlined,
  SelectOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import {
  useDeleteMultiplePaymentsMutation,
  useGeneratePdfMutation,
  useGenerateExcelMutation,
} from '@common/api/paymentApi/payment.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddPaymentModal from '@components/AddPaymentModal'
import StreetsSelector from '@components/StreetsSelector'
import ImportInvoices from '@components/UI/PaymentCardHeader/ImportInvoices'
import PaymentCascader from '@components/UI/PaymentCascader/index'
import {
  CompanyFilterTags,
  DomainFilterTags,
} from '@components/UI/Reusable/FilterTags'
import { AppRoutes, Roles, ServiceName } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import {
  Button,
  Checkbox,
  Flex,
  Select,
  SelectProps,
  Space,
  Typography,
  message,
} from 'antd'
import Modal from 'antd/lib/modal/Modal'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const PaymentCardHeader = ({
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
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleExportExcel = async () => {
    try {
      const response = await generateExcel({
        payments: selectedPayments,
      })
      const blob = new Blob([new Uint8Array(response.data.buffer?.data)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, `payments.xlsx`)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeletePayments = async () => {
    ;(Modal as any).confirm({
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

  const [generatePdf] = useGeneratePdfMutation()

  const handleGeneratePdf = async () => {
    try {
      const response = await generatePdf({
        payments: selectedPayments,
      })

      if ('data' in response) {
        const { data } = response

        if (data) {
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

  return (
    <Flex justify="space-between">
      <Space>
        <Button
          type="link"
          onClick={() => {
            if (enablePaymentsButton) {
              router.push(AppRoutes.PAYMENT)
            }
          }}
        >
          {isAdmin ? 'Платежі' : 'Мої оплати'}
        </Button>

        {pathname === AppRoutes.PAYMENT && (
          <Space>
            <ColumnSelect
              style={{ minWidth: 200 }}
              onSelect={onColumnsSelect}
            />
            <Space.Compact>
              <PaymentCascader onChange={setCurrentDateFilter} />
              <StreetsSelector setFilters={setFilters} streets={streets} />
            </Space.Compact>
            <Space direction="vertical" size={4} style={{ minWidth: 300 }}>
              <DomainFilterTags
                collection={payments?.domainsFilter}
                filters={filters}
                setFilters={setFilters}
              />
              <CompanyFilterTags
                collection={payments?.realEstatesFilter}
                filters={filters}
                setFilters={setFilters}
              />
            </Space>
          </Space>
        )}
      </Space>
      <Flex wrap align="center" justify="flex-end">
        {isAdmin &&
          pathname === AppRoutes.PAYMENT &&
          selectedPayments.length > 0 && (
          <Button type="link" onClick={() => handleExportExcel()}>
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
        {(isModalOpen || currentPayment) && (
          <AddPaymentModal
            paymentActions={
              !isAdmin ? { edit: false, preview: true } : paymentActions
            }
            paymentData={currentPayment}
            closeModal={closeModal}
          />
        )}
        {isAdmin &&
          pathname === AppRoutes.PAYMENT &&
          selectedPayments.length > 0 && (
            <Button type="link" onClick={() => handleGeneratePdf()}>
              Завантажити рахунки <DownloadOutlined />
            </Button>
          )}
        {isGlobalAdmin &&
          pathname === AppRoutes.PAYMENT &&
          selectedPayments.length > 0 && (
            <Button type="link" onClick={() => handleDeletePayments()}>
              <DeleteOutlined /> Видалити
            </Button>
          )}
      </Flex>
    </Flex>
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
    setSelected(JSON.parse(localStorage.getItem('payments_columns')) ?? [])
  }, [])

  useEffect(() => {
    onSelect?.(selected)
  }, [onSelect, selected])

  useEffect(() => {
    const savedColumns =
      JSON.parse(localStorage.getItem('payments_columns')) ?? []

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

export default PaymentCardHeader
