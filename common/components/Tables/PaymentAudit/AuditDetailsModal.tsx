import { RefObject, UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Col,
  Flex,
  Modal,
  Row,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd'
import {
  CheckCircleOutlined,
  CodeOutlined,
  DiffOutlined,
  EyeOutlined,
  HistoryOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  IPaymentChangeLog,
  PaymentActionType,
} from '@common/api/paymentApi/payment.api.types'
import { useRestorePaymentMutation } from '@common/api/paymentApi/payment.api'
import { ACTION_COLORS } from './usePaymentAuditColumns'
import { resolveBuiltinTemplateKey } from '@components/Forms/GroupedReceiptForm/templateMap'
import InvoiceReceiptView from './InvoiceReceiptView'
import { JsonDiffLine, buildJsonSideDiff } from './jsonDiff'
import { useDiffColors } from './diffColors'
import { useReceiptDiffHighlight } from './receiptDiff'

const { Text, Title } = Typography

const RESTORABLE: PaymentActionType[] = ['DELETE', 'BULK_DELETE', 'UPDATE']

const JSON_LINE_PADDING = 12

const JsonSnapshot = ({
  title,
  value,
  span = 12,
  diff,
  side,
  preRef,
  onScroll,
}: {
  title: string
  value: unknown
  span?: number
  diff?: JsonDiffLine[]
  side?: 'before' | 'after'
  preRef?: RefObject<HTMLPreElement>
  onScroll?: (event: UIEvent<HTMLPreElement>) => void
}) => {
  const { token } = theme.useToken()
  const diffColors = useDiffColors()
  const highlight = diffColors[side === 'before' ? 'before' : 'after'].line

  return (
    <Col xs={24} md={span}>
      <Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Title>
      <pre
        ref={preRef}
        onScroll={onScroll}
        style={{
          background: token.colorFillTertiary,
          border: `1px solid ${token.colorBorderSecondary}`,
          color: token.colorText,
          borderRadius: 6,
          padding: JSON_LINE_PADDING,
          margin: 0,
          maxHeight: 420,
          overflow: 'auto',
          fontSize: 12,
          whiteSpace: diff ? 'pre' : 'pre-wrap',
          wordBreak: diff ? 'normal' : 'break-word',
        }}
      >
        {diff
          ? diff.map((line, index) => (
              <div
                key={index}
                style={{
                  margin: `0 -${JSON_LINE_PADDING}px`,
                  padding: `0 ${JSON_LINE_PADDING}px`,
                  background: line.filler
                    ? diffColors.filler
                    : line.marker !== ' '
                      ? highlight
                      : undefined,
                }}
              >
                <span style={{ userSelect: 'none', opacity: 0.55 }}>
                  {line.marker}{' '}
                </span>
                {line.text || ' '}
              </div>
            ))
          : value
            ? JSON.stringify(value, null, 2)
            : '—'}
      </pre>
    </Col>
  )
}

interface Props {
  open: boolean
  record: IPaymentChangeLog | null
  onClose: () => void
}

const AuditDetailsModal: React.FC<Props> = ({ open, record, onClose }) => {
  const [restorePayment, { isLoading }] = useRestorePaymentMutation()
  const [view, setView] = useState<string>('Перегляд')
  const [showDiff, setShowDiff] = useState(false)
  const beforeReceiptRef = useRef<HTMLDivElement>(null)
  const afterReceiptRef = useRef<HTMLDivElement>(null)
  const beforeJsonRef = useRef<HTMLPreElement>(null)
  const afterJsonRef = useRef<HTMLPreElement>(null)
  const syncingScroll = useRef(false)

  const hasBefore = !!record?.before
  const hasAfter = !!record?.after
  const isLegacy = !!record && !hasBefore && !hasAfter

  const canDiff = record?.actionType === 'UPDATE' && hasBefore && hasAfter
  const diffMode = canDiff && showDiff

  const sameTemplate =
    !record?.before ||
    !record?.after ||
    resolveBuiltinTemplateKey(record.before) ===
      resolveBuiltinTemplateKey(record.after)

  useEffect(() => {
    if (record) {
      setView('Перегляд')
      setShowDiff(false)
    }
  }, [record])

  useReceiptDiffHighlight(
    diffMode && view !== 'JSON' && sameTemplate,
    beforeReceiptRef,
    afterReceiptRef
  )

  const jsonDiff = useMemo(
    () =>
      diffMode ? buildJsonSideDiff(record?.before, record?.after) : undefined,
    [diffMode, record?.before, record?.after]
  )

  const syncScroll =
    (source: 'before' | 'after') => (event: UIEvent<HTMLPreElement>) => {
      if (syncingScroll.current) return
      const target =
        source === 'before' ? afterJsonRef.current : beforeJsonRef.current
      if (!target) return

      syncingScroll.current = true
      target.scrollTop = event.currentTarget.scrollTop
      target.scrollLeft = event.currentTarget.scrollLeft
      requestAnimationFrame(() => {
        syncingScroll.current = false
      })
    }

  const canRestore =
    !!record?.actionType && RESTORABLE.includes(record.actionType) && hasBefore

  const handleRestore = async () => {
    if (!record) return
    const res = await restorePayment({ logId: record._id })
    if ('data' in res) {
      message.success('Рахунок відновлено')
      onClose()
    } else {
      const err = res.error as any
      message.error(err?.data?.message || 'Не вдалося відновити рахунок')
    }
  }

  const restoreButton = canRestore && (
    <Button
      type="primary"
      icon={<UndoOutlined />}
      loading={isLoading}
      onClick={handleRestore}
    >
      Відновити рахунок
    </Button>
  )

  const diffLabel = showDiff ? 'Сховати зміни' : 'Показати зміни'

  const diffButton = canDiff && (
    <Tooltip title="Підсвітити, що саме змінилось: червоне — до, зелене — після">
      <Button
        type={showDiff ? 'primary' : 'default'}
        icon={<DiffOutlined />}
        onClick={() => setShowDiff((value) => !value)}
      >
        {diffLabel}
      </Button>
    </Tooltip>
  )

  const renderPreview = () => {
    if (!record) return null
    if (isLegacy) {
      return <InvoiceReceiptView snapshot={record.invoiceData} />
    }
    return (
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Title level={5} style={{ marginTop: 0 }}>
            <HistoryOutlined /> До
          </Title>
          <div ref={beforeReceiptRef}>
            {record.before ? (
              <InvoiceReceiptView snapshot={record.before} />
            ) : (
              <Text type="secondary">—</Text>
            )}
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Title level={5} style={{ marginTop: 0 }}>
            <CheckCircleOutlined /> Після
          </Title>
          <div ref={afterReceiptRef}>
            {record.after ? (
              <InvoiceReceiptView snapshot={record.after} />
            ) : (
              <Text type="secondary">—</Text>
            )}
          </div>
        </Col>
      </Row>
    )
  }

  const renderJson = () => {
    if (!record) return null
    if (isLegacy) {
      return (
        <Row gutter={16}>
          <JsonSnapshot
            title="Дані інвойсу"
            value={record.invoiceData}
            span={24}
          />
        </Row>
      )
    }
    return (
      <Row gutter={16}>
        <JsonSnapshot
          title="До"
          value={record.before}
          diff={jsonDiff?.before}
          side="before"
          preRef={beforeJsonRef}
          onScroll={jsonDiff && syncScroll('before')}
        />
        <JsonSnapshot
          title="Після"
          value={record.after}
          diff={jsonDiff?.after}
          side="after"
          preRef={afterJsonRef}
          onScroll={jsonDiff && syncScroll('after')}
        />
      </Row>
    )
  }

  const options = [
    { value: 'Перегляд', label: 'Перегляд', icon: <EyeOutlined /> },
    { value: 'JSON', label: 'JSON', icon: <CodeOutlined /> },
  ]

  const sideBySide = !isLegacy

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={sideBySide ? '95vw' : 900}
      style={{ top: 20, ...(sideBySide ? { maxWidth: 1700 } : {}) }}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрити
        </Button>,
      ]}
      title={
        record ? (
          <Space wrap>
            {record.actionType && (
              <Tag color={ACTION_COLORS[record.actionType]}>
                {record.actionType}
              </Tag>
            )}
            <Text>
              {record.actorEmail || 'system'} ·{' '}
              {dayjs(record.date).format('DD.MM.YYYY HH:mm')}
            </Text>
          </Space>
        ) : (
          'Деталі'
        )
      }
    >
      {record && (
        <>
          <Flex
            justify="space-between"
            align="center"
            gap={8}
            wrap="wrap"
            style={{ marginBottom: 16 }}
          >
            <Segmented
              options={options}
              value={view}
              onChange={(v) => setView(v as string)}
            />
            <Space wrap>
              {diffButton}
              {restoreButton}
            </Space>
          </Flex>
          {view === 'JSON' ? renderJson() : renderPreview()}
        </>
      )}
    </Modal>
  )
}

export default AuditDetailsModal
