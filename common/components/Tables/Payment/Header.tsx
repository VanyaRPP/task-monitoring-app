import PaymentCardHeader from '@components/UI/PaymentCardHeader'
import {
  IExtendedPayment,
  IGetPaymentResponse,
  IFilter,
} from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import { PaymentDateRange } from '@utils/paymentDateRange'

export interface PaymentDeleteItem {
  id: string
  date: string
  domain: string
  company: string
}

export interface PaymentsHeaderProps {
  paymentsDeleteItems: PaymentDeleteItem[]
  closeEditModal: () => void
  onDateRangeChange: (range: PaymentDateRange | null) => void
  showDateRangeFilter?: boolean
  dateHistoryScope?: string
  currentPayment: Partial<IExtendedPayment>
  paymentActions: { edit: boolean; preview: boolean }
  streets: IFilter[]
  payments: IGetPaymentResponse
  filters: Record<string, any> | undefined
  setFilters: (filters: Record<string, any> | undefined) => void
  selectedPayments: IExtendedPayment[]
  setSelectedPayments: (payments: IExtendedPayment[]) => void
  setPaymentsDeleteItems: (items: PaymentDeleteItem[]) => void
  enablePaymentsButton: boolean
  onColumnsSelect: (columns: ServiceType[]) => void
  onBulkMarkPaid?: (payments: IExtendedPayment[]) => void
  onBulkDuplicate?: (payments: IExtendedPayment[]) => void
  onRefresh?: () => void | Promise<unknown>
  isRefreshing?: boolean
  onDeleteClick?: () => void
  domainFilter: IFilter[]
  realEstatesFilter: IFilter[]
  isDashboard?: boolean
}

const PaymentsHeader: React.FC<PaymentsHeaderProps> = ({
  paymentsDeleteItems,
  closeEditModal,
  onDateRangeChange,
  showDateRangeFilter,
  dateHistoryScope,
  currentPayment,
  paymentActions,
  streets,
  payments,
  filters,
  setFilters,
  selectedPayments,
  setSelectedPayments,
  setPaymentsDeleteItems,
  enablePaymentsButton,
  onColumnsSelect,
  onBulkMarkPaid,
  onBulkDuplicate,
  onRefresh,
  isRefreshing,
  domainFilter,
  realEstatesFilter,
  isDashboard,
  onDeleteClick,
}) => {
  return (
    <PaymentCardHeader
      paymentsDeleteItems={paymentsDeleteItems}
      closeEditModal={closeEditModal}
      onDateRangeChange={onDateRangeChange}
      showDateRangeFilter={showDateRangeFilter}
      dateHistoryScope={dateHistoryScope}
      currentPayment={currentPayment}
      paymentActions={paymentActions}
      streets={streets}
      payments={payments}
      filters={filters}
      setFilters={setFilters}
      selectedPayments={selectedPayments}
      setSelectedPayments={setSelectedPayments}
      setPaymentsDeleteItems={setPaymentsDeleteItems}
      enablePaymentsButton={enablePaymentsButton}
      onColumnsSelect={onColumnsSelect}
      onBulkMarkPaid={onBulkMarkPaid}
      onBulkDuplicate={onBulkDuplicate}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      domainFilter={domainFilter}
      realEstatesFilter={realEstatesFilter}
      isDashboard={isDashboard}
      onDeleteClick={onDeleteClick}
    />
  )
}

export default PaymentsHeader
