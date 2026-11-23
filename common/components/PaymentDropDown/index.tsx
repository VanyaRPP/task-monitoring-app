import {
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  DownloadOutlined,
  MailOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, MenuProps, message, App } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  IExtendedPayment,
  PaymentStatus,
} from '@common/api/paymentApi/payment.api.types'
import { Operations } from '@utils/constants'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import { useHtmlToPdfMutation } from '@common/api/paymentApi/payment.api'
import HeadlessReceiptRenderer from '@components/Forms/GroupedReceiptForm/HeadlessReceiptRenderer'
import { saveAs } from 'file-saver'
import { useState } from 'react'
import dayjs from 'dayjs'

import s from './PaymentDropDown.module.scss'

interface Props {
  payment: IExtendedPayment
  isAdmin: boolean
  onView: (p: IExtendedPayment) => void
  onEdit: (p: IExtendedPayment) => void
  onDelete: (id: string) => void
  onMarkPaid: (p: IExtendedPayment) => void
  onDuplicate: (p: IExtendedPayment) => void
  onSendPaymentEmail: (
    paymentId: string,
    html?: string
  ) => Promise<{ success: boolean }>
  onUpdatePaymentStatus: (args: {
    _id: string
    status: PaymentStatus
  }) => Promise<unknown>
  deleteLoading: boolean
}

type CaptureIntent = 'download' | 'send'

function buildPaymentFileName(payment: IExtendedPayment): string {
  const companyName = (payment as any)?.reciever?.companyName ?? 'invoice'
  const datePrefix = dayjs((payment as any)?.invoiceCreationDate).isValid()
    ? dayjs((payment as any)?.invoiceCreationDate).format('DDMMYY')
    : ''
  const slug = `${datePrefix}${(payment as any)?.invoiceNumber ?? ''}`
  return `${companyName} inv ${slug}`.trim()
}

const PaymentDropdown: React.FC<Props> = ({
  payment,
  isAdmin,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
  onDuplicate,
  onSendPaymentEmail,
  onUpdatePaymentStatus,
  deleteLoading,
}) => {
  const { t } = useTranslation()
  const [htmlToPdf, { isLoading: pdfLoading }] = useHtmlToPdfMutation()
  const [captureIntent, setCaptureIntent] = useState<CaptureIntent | null>(null)
  const [isSending, setIsSending] = useState(false)

  const isCapturing = captureIntent !== null
  const isSent = payment.status === PaymentStatus.Sent

  const handleDownloadPdf = () => {
    if (isCapturing || pdfLoading) return
    setCaptureIntent('download')
  }

  const handleDownloadCapture = async (html: string) => {
    try {
      const fileName = buildPaymentFileName(payment)
      const response = await htmlToPdf({ html, fileName })

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
        // eslint-disable-next-line no-console
        console.error('htmlToPdf failed:', response.error)
        const serverMsg = (response.error as { data?: { error?: string } })
          ?.data?.error
        message.error(
          serverMsg
            ? `PDF: ${serverMsg}`
            : 'Сталася помилка під час генерації PDF'
        )
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('htmlToPdf threw:', error)
      message.error(
        `PDF: ${(error as Error)?.message ?? 'несподівана помилка'}`
      )
    } finally {
      setCaptureIntent(null)
    }
  }

  const handleSendCapture = async (html: string) => {
    setCaptureIntent(null)
    setIsSending(true)
    try {
      const response = await onSendPaymentEmail(payment._id, html)
      if (!response?.success) {
        message.error(t('payments.messages.sendFailed'))
        return
      }

      await onUpdatePaymentStatus({
        _id: payment._id,
        status: PaymentStatus.Sent,
      })
      message.success(t('payments.messages.sendSuccess'))
    } catch {
      message.error(t('payments.messages.sendFailed'))
    } finally {
      setIsSending(false)
    }
  }

  const handleCapture = (html: string) => {
    if (captureIntent === 'send') {
      handleSendCapture(html)
      return
    }
    handleDownloadCapture(html)
  }

  const handleCaptureError = (error: Error) => {
    // eslint-disable-next-line no-console
    console.error('HeadlessReceiptRenderer failed:', error)
    message.error(
      captureIntent === 'send'
        ? t('payments.messages.sendFailed')
        : 'Не вдалося згенерувати макет PDF'
    )
    setCaptureIntent(null)
  }

  const handleSend = () => {
    if (isSent || isSending || isCapturing) return
    setCaptureIntent('send')
  }

  const adminItems: MenuProps['items'] = isAdmin
    ? [
        { key: 'edit', label: 'Редагувати', icon: <EditOutlined /> },
        ...(payment.type !== Operations.Credit
          ? [
              {
                key: 'mark',
                label: 'Позначити оплату',
                icon: <CheckOutlined />,
              },
            ]
          : []),
        {
          key: 'duplicate',
          label: 'Дублювати рахунок',
          icon: <CopyOutlined />,
        },
      ]
    : []

  const adminDeleteItems: MenuProps['items'] = isAdmin
    ? [
        { type: 'divider' },
        {
          key: 'delete',
          danger: true,
          disabled: deleteLoading,
          label: 'Видалити платіж',
          icon: <DeleteOutlined />,
        },
      ]
    : []

  const items: MenuProps['items'] = [
    { key: 'view', label: 'Переглянути', icon: <EyeOutlined /> },
    ...adminItems,
    {
      key: 'download',
      label: 'Завантажити рахунок',
      icon: <DownloadOutlined />,
      disabled: pdfLoading || isCapturing,
    },
    {
      key: 'send',
      label: isSent
        ? t('payments.statuses.sent')
        : t('payments.statuses.draft'),
      icon: <MailOutlined />,
      disabled: isSent || isSending || isCapturing,
    },
    ...adminDeleteItems,
  ]

  const { modal } = App.useApp()

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'view') onView(payment)
    if (key === 'edit') onEdit(payment)
    if (key === 'mark') onMarkPaid(payment)
    if (key === 'duplicate') onDuplicate(payment)
    if (key === 'download') handleDownloadPdf()
    if (key === 'send') handleSend()
    if (key === 'delete') {
      modal.confirm({
        title: `Видалити оплату від ${dateToDefaultFormat(
          payment.invoiceCreationDate as unknown as string
        )}?`,
        okText: 'Так',
        cancelText: 'Відміна',
        okType: 'danger',
        onOk: () => onDelete(payment._id),

        width: 440,
        okButtonProps: {
          className: s.customOkBtn,
        },
      })
    }
  }

  return (
    <>
      <Dropdown
        menu={{ items, onClick: handleMenuClick }}
        trigger={['click']}
        placement="bottomRight"
        overlayStyle={{ minWidth: 190 }}
      >
        <Button type="text" icon={<MoreOutlined />} style={{ padding: 0 }} />
      </Dropdown>
      {isCapturing && (
        <HeadlessReceiptRenderer
          payment={payment}
          onCapture={handleCapture}
          onError={handleCaptureError}
        />
      )}
    </>
  )
}

export default PaymentDropdown
