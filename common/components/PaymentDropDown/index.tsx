import { CheckOutlined, DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons'
import { Button, Dropdown, MenuProps, Popconfirm, theme } from 'antd'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Operations } from '@utils/constants'

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
  const items: MenuProps['items'] = [
  { key: 'view', label: 'Переглянути', icon: <EyeOutlined /> },

  ...(isAdmin
    ? [{ key: 'edit', label: 'Редагувати', icon: <EditOutlined /> }]
    : []),

  ...(isAdmin && payment.type !== Operations.Credit
    ? [{ key: 'mark', label: 'Позначити оплату', icon: <CheckOutlined /> }]
    : []),

  { type: 'divider' },

  ...(isAdmin
    ? [
        {
          key: 'delete',
          danger: true,
          disabled: deleteLoading,
          label: (
            <Popconfirm
              title="Видалити?"
              onConfirm={() => onDelete(payment._id)}
            >
              <span>
                <DeleteOutlined /> Видалити
              </span>
            </Popconfirm>
          ),
        },
      ]
    : []),
]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'view') onView(payment)
    if (key === 'edit') onEdit(payment)
    if (key === 'mark') onMarkPaid(payment)
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