import PriceList from '@components/Forms/AddPaymentForm/PriceList'
import GroupedReceiptForm from '@components/Forms/GroupedReceiptForm'
import ReceiptForm from '@components/Forms/ReceiptForm'
import useLivePayment from '@components/AddPaymentModal/useLivePayment'
import { Empty } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'
import s from './style.module.scss'

interface PaymentActions {
  preview: boolean
  edit: boolean
}

interface LiveDocumentProps {
  paymentActions: PaymentActions
  hideToolbar?: boolean
}

const NoCompanyYet: FC = () => (
  <Empty
    image={Empty.PRESENTED_IMAGE_SIMPLE}
    description="Оберіть компанію — і тут з’явиться рахунок"
  />
)

/** The invoice, redrawn as the form is filled in. */
export const LiveInvoice: FC<LiveDocumentProps> = ({
  paymentActions,
  hideToolbar,
}) => {
  const payment = useLivePayment()
  if (!payment) return <NoCompanyYet />

  return (
    <GroupedReceiptForm
      currPayment={payment}
      paymentActions={paymentActions}
      hideToolbar={hideToolbar}
    />
  )
}

/** The "Акт" document for the form's current values. */
export const LivePriceList: FC = () => {
  const payment = useLivePayment()
  if (!payment || !Array.isArray(payment.invoice)) return <NoCompanyYet />

  return <PriceList data={payment} />
}

/** The "Довідка" document for the form's current values. */
export const LiveReceipt: FC<LiveDocumentProps> = ({ paymentActions }) => {
  const payment = useLivePayment()
  if (!payment) return <NoCompanyYet />

  return (
    <ReceiptForm
      currPayment={payment}
      paymentData={undefined}
      paymentActions={paymentActions}
    />
  )
}

// The width the invoice templates are laid out for (the same one
// HeadlessReceiptRenderer renders them at for a PDF).
const INVOICE_PAGE_WIDTH = 860

/**
 * The live invoice next to the form on a wide screen. The column is narrower
 * than a page, so the page is drawn at its own width and scaled down to fit:
 * what the user sees keeps the proportions of what will be printed.
 */
export const SideInvoicePreview: FC<{ paymentActions: PaymentActions }> = ({
  paymentActions,
}) => {
  const ref = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const pane = ref.current
    if (!pane || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    )
    observer.observe(pane)
    return () => observer.disconnect()
  }, [])

  return (
    <aside
      ref={ref}
      className={s.pane}
      aria-label="Попередній перегляд рахунку"
    >
      <div
        className={s.page}
        style={{
          width: INVOICE_PAGE_WIDTH,
          zoom: width ? Math.min(width / INVOICE_PAGE_WIDTH, 1) : undefined,
        }}
      >
        <LiveInvoice paymentActions={paymentActions} hideToolbar />
      </div>
    </aside>
  )
}
