import {
  Button,
  Col,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import { UndoOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  IPaymentChangeLog,
  PaymentActionType,
} from '@common/api/paymentApi/payment.api.types'
import { useRestorePaymentMutation } from '@common/api/paymentApi/payment.api'
import { ACTION_COLORS } from './usePaymentAuditColumns'

const { Text, Title } = Typography

const RESTORABLE: PaymentActionType[] = ['DELETE', 'BULK_DELETE']

const Snapshot = ({
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

  const canRestore =
    !!record?.actionType && RESTORABLE.includes(record.actionType)

  const handleRestore = async () => {
    if (!record) return
    const res = await restorePayment({ logId: record._id })
    if ('data' in res) {
      message.success('Платіж відновлено')
      onClose()
    } else {
      const err = res.error as any
      message.error(err?.data?.message || 'Не вдалося відновити платіж')
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={920}
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
      footer={
        canRestore
          ? [
              <Popconfirm
                key="restore"
                title="Відновити цей платіж?"
                description="Платіж буде створено з його оригінальним ідентифікатором."
                okText="Відновити"
                cancelText="Скасувати"
                onConfirm={handleRestore}
                okButtonProps={{ loading: isLoading }}
              >
                <Button type="primary" icon={<UndoOutlined />} loading={isLoading}>
                  Відновити
                </Button>
              </Popconfirm>,
            ]
          : null
      }
    >
      {record &&
        (record.before || record.after ? (
          <Row gutter={16}>
            <Snapshot title="До" value={record.before} />
            <Snapshot title="Після" value={record.after} />
          </Row>
        ) : (
          <Row gutter={16}>
            <Snapshot
              title="Дані інвойсу"
              value={record.invoiceData}
              span={24}
            />
          </Row>
        ))}
    </Modal>
  )
}

export default AuditDetailsModal
