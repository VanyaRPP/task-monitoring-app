import { useEffect, useState } from 'react'
import {
  Button,
  Col,
  Flex,
  Modal,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import {
  CheckCircleOutlined,
  CodeOutlined,
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
import InvoiceReceiptView from './InvoiceReceiptView'

const { Text, Title } = Typography

const RESTORABLE: PaymentActionType[] = ['DELETE', 'BULK_DELETE', 'UPDATE']

const JsonSnapshot = ({
  title,
  value,
  span = 12,
}: {
  title: string
  value: unknown
  span?: number
}) => {
  const { token } = theme.useToken()
  return (
    <Col xs={24} md={span}>
      <Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Title>
      <pre
        style={{
          background: token.colorFillTertiary,
          border: `1px solid ${token.colorBorderSecondary}`,
          color: token.colorText,
          borderRadius: 6,
          padding: 12,
          margin: 0,
          maxHeight: 420,
          overflow: 'auto',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {value ? JSON.stringify(value, null, 2) : '—'}
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

  const hasBefore = !!record?.before
  const hasAfter = !!record?.after
  const isLegacy = !!record && !hasBefore && !hasAfter

  useEffect(() => {
    if (record) setView('Перегляд')
  }, [record])

  const canRestore =
    !!record?.actionType &&
    RESTORABLE.includes(record.actionType) &&
    hasBefore

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
          {record.before ? (
            <InvoiceReceiptView snapshot={record.before} />
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Col>
        <Col xs={24} md={12}>
          <Title level={5} style={{ marginTop: 0 }}>
            <CheckCircleOutlined /> Після
          </Title>
          {record.after ? (
            <InvoiceReceiptView snapshot={record.after} />
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Col>
      </Row>
    )
  }

  const renderJson = () => {
    if (!record) return null
    if (isLegacy) {
      return (
        <Row gutter={16}>
          <JsonSnapshot title="Дані інвойсу" value={record.invoiceData} span={24} />
        </Row>
      )
    }
    return (
      <Row gutter={16}>
        <JsonSnapshot title="До" value={record.before} />
        <JsonSnapshot title="Після" value={record.after} />
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
            {restoreButton}
          </Flex>
          {view === 'JSON' ? renderJson() : renderPreview()}
        </>
      )}
    </Modal>
  )
}

export default AuditDetailsModal
