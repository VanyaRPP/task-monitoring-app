import { FC, useEffect, useRef } from 'react'
import { resolveBuiltinTemplateKey, templateMap } from './templateMap'
import { useReceiptTemplateProps } from './useReceiptTemplateProps'
import { snapshotNodeToStandaloneHtml } from '@utils/pdf/captureDom'

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

  const receiptProps = useReceiptTemplateProps({
    data: payment,
    contextCompany,
  })

  const resolvedKey = templateKey || resolveBuiltinTemplateKey(payment)
  const TemplateComponent = templateMap[resolvedKey] || templateMap.classic

  useEffect(() => {
    if (capturedRef.current) return

    const timer = window.setTimeout(() => {
      if (capturedRef.current) return
      try {
        const node = componentRef.current
        if (!node) {
          throw new Error('HeadlessReceiptRenderer: nothing rendered to capture')
        }
        const html = snapshotNodeToStandaloneHtml(node)
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
