import { CheckOutlined, DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Dropdown, MenuProps, Modal, message } from 'antd'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Operations } from '@utils/constants'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import { useGeneratePdfMutation } from '@common/api/paymentApi/payment.api'
import { saveAs } from 'file-saver'

interface Props {
  payment: IExtendedPayment
  isAdmin: boolean
  onView: (p: IExtendedPayment) => void
  onEdit: (p: IExtendedPayment) => void
  onDelete: (id: string) => void
  onMarkPaid: (p: IExtendedPayment) => void
  deleteLoading: boolean
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

const [generatePdf, { isLoading: pdfLoading }] = useGeneratePdfMutation()

const handleDownloadPdf = async () => {
  try {
    const response = await generatePdf({ payments: [payment] })
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
      message.error('Сталася помилка під час генерації PDF')
    }
  } catch (error) {
    message.error('Сталася несподівана помилка під час генерації PDF')
  }
}

  const adminItems: MenuProps['items'] = isAdmin
    ? [
        { key: 'edit', label: 'Редагувати', icon: <EditOutlined /> },
        ...(payment.type !== Operations.Credit
          ? [{ key: 'mark', label: 'Позначити оплату', icon: <CheckOutlined /> }]
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
      disabled: pdfLoading,
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
        title: `Видалити оплату від ${dateToDefaultFormat(payment.invoiceCreationDate as unknown as string)}?`,
        okText: 'Так',
        cancelText: 'Відміна',
        okType: 'danger',
        onOk: () => onDelete(payment._id),
      })
    }
  }

  return (
    <Dropdown
      menu={{ items, onClick: handleMenuClick }}
      trigger={['click']}
      placement="bottomRight"
      overlayStyle={{ minWidth: 190 }}
    >
      <Button type="text" icon={<MoreOutlined />} style={{ padding: 0 }} />
    </Dropdown>
  )
}

export default PaymentDropdown