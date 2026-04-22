import { CheckOutlined, DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons'
import { Button, Dropdown, MenuProps, Modal } from 'antd'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Operations } from '@utils/constants'
import { dateToDefaultFormat } from '@assets/features/formatDate'

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
  const adminItems: MenuProps['items'] = isAdmin
    ? [
        { key: 'edit', label: 'Редагувати', icon: <EditOutlined /> },
        ...(payment.type !== Operations.Credit
          ? [{ key: 'mark', label: 'Позначити оплату', icon: <CheckOutlined /> }]
          : []),
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
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'view') onView(payment)
    if (key === 'edit') onEdit(payment)
    if (key === 'mark') onMarkPaid(payment)
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
