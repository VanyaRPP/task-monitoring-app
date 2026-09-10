import { FC, useEffect, useRef } from 'react'
import { useGetInvoiceTemplatesQuery } from '@common/api/invoiceTemplateApi/invoiceTemplate.api'
import { normalizeCurrency } from '@utils/helpers'
import { resolveTemplateCandidate, templateMap } from './templateMap'
import { useReceiptTemplateProps } from './useReceiptTemplateProps'
import { applyDescriptionOverrides } from './applyDescriptionOverrides'
import { readShowQuantityInPreview } from './previewQtyStorage'
import { resolveInvoiceLang } from './resolveInvoiceLang'
import { captureInvoiceHtml } from './captureInvoiceHtml'

interface Props {
  payment: any
  contextCompany?: any
  templateKey?: string
  captureDelayMs?: number
  onCapture: (html: string) => void
  onError?: (error: Error) => void
}

const HeadlessReceiptRenderer: FC<Props> = ({
  payment,
  contextCompany,
  templateKey,
  captureDelayMs = 800,
  onCapture,
  onError,
}) => {
  const componentRef = useRef<HTMLDivElement | null>(null)
  const capturedRef = useRef(false)

  const domainId: string =
    (typeof payment?.domain === 'object'
      ? payment?.domain?._id
      : payment?.domain) || ''
  const { data: customTemplatesRes } = useGetInvoiceTemplatesQuery(
    { domainId },
    { skip: !domainId }
  )
  const templateId = templateKey || resolveTemplateCandidate(payment)
  const customTemplate =
    customTemplatesRes?.data?.find((t) => t._id === templateId) ?? null

  const descriptionOverrides = customTemplate
    ? {
        providerDescription: customTemplate.providerDescription,
        receiverDescription: customTemplate.receiverDescription,
      }
    : undefined

  const currency = normalizeCurrency(
    payment?.currency ||
      (typeof payment?.company === 'object'
        ? payment?.company?.currency
        : undefined) ||
      contextCompany?.currency
  )

  const receiptProps = useReceiptTemplateProps({
    data: applyDescriptionOverrides(
      payment ? { ...payment, currency } : payment,
      descriptionOverrides
    ),
    contextCompany,
    descriptionOverrides,
    overrides: customTemplate?.overrides,
    lang: resolveInvoiceLang(payment),
    showQuantityInPreview: readShowQuantityInPreview(payment?._id),
  })

  const resolvedKey =
    customTemplate?.baseTemplateKey ||
    (templateId in templateMap ? templateId : 'classic')
  const TemplateComponent = templateMap[resolvedKey] || templateMap.classic

  useEffect(() => {
    if (capturedRef.current) return

    const timer = window.setTimeout(() => {
      if (capturedRef.current) return
      try {
        const html = captureInvoiceHtml(componentRef.current)
        capturedRef.current = true
        onCapture(html)
      } catch (err) {
        capturedRef.current = true
        onError?.(err as Error)
      }
    }, captureDelayMs)

    return () => window.clearTimeout(timer)
  }, [captureDelayMs, onCapture, onError])

  const templateProps = {
    ...receiptProps,
    componentRef,
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: '860px',
        pointerEvents: 'none',
        opacity: 0,
      }}
    >
      <TemplateComponent {...templateProps} />
    </div>
  )
}

export default HeadlessReceiptRenderer
