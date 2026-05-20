import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, MenuProps, Modal, message } from 'antd'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Operations } from '@utils/constants'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import { useHtmlToPdfMutation } from '@common/api/paymentApi/payment.api'
import HeadlessReceiptRenderer from '@components/Forms/GroupedReceiptForm/HeadlessReceiptRenderer'
import { saveAs } from 'file-saver'
import { useState } from 'react'
import dayjs from 'dayjs'

interface Props {
  payment: IExtendedPayment
  isAdmin: boolean
  onView: (p: IExtendedPayment) => void
  onEdit: (p: IExtendedPayment) => void
  onDelete: (id: string) => void
  onMarkPaid: (p: IExtendedPayment) => void
  deleteLoading: boolean
}

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
  deleteLoading,
}) => {
  const [htmlToPdf, { isLoading: pdfLoading }] = useHtmlToPdfMutation()
  const [isCapturing, setIsCapturing] = useState(false)

  const handleDownloadPdf = () => {
    if (isCapturing || pdfLoading) return
    setIsCapturing(true)
  }

  const handleCapture = async (html: string) => {
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
      setIsCapturing(false)
    }
  }

  const handleCaptureError = (error: Error) => {
    // eslint-disable-next-line no-console
    console.error('HeadlessReceiptRenderer failed:', error)
    message.error('Не вдалося згенерувати макет PDF')
    setIsCapturing(false)
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
    ...adminDeleteItems,
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'view') onView(payment)
    if (key === 'edit') onEdit(payment)
    if (key === 'mark') onMarkPaid(payment)
    if (key === 'download') handleDownloadPdf()
    if (key === 'delete') {
      Modal.confirm({
        title: `Видалити оплату від ${dateToDefaultFormat(
          payment.invoiceCreationDate as unknown as string
        )}?`,
        okText: 'Так',
        cancelText: 'Відміна',
        okType: 'danger',
        onOk: () => onDelete(payment._id),
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
