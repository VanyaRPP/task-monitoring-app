import {
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useDeleteServiceMutation } from '@common/api/serviceApi/service.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { PaymentsTable } from '@common/components/Tables/PaymentsTable'
import { EditPaymentButton } from '@common/components/UI/Buttons/EditPaymentButton'
import { AppRoutes, Roles } from '@utils/constants'
import { Button, Popconfirm, Space, message } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export const Payments: React.FC = () => {
  const router = useRouter()

  const { data: user } = useGetCurrentUserQuery()

  const isDomainAdmin = useMemo(
    () => user?.roles?.includes(Roles.DOMAIN_ADMIN),
    [user]
  )
  const isGlobalAdmin = useMemo(
    () => user?.roles?.includes(Roles.GLOBAL_ADMIN),
    [user]
  )

  const [selected, setSelected] = useState<string[]>([])

  const [deleteService] = useDeleteServiceMutation()

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selected.map((id) => deleteService(id).unwrap()))
      message.success('Проплати успішно видалено!')
      setSelected([])
    } catch (error) {
      message.error('При видаленні проплат сталася помилка')
    }
  }, [selected, deleteService])

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ width: '100%' }}>
        {router.pathname === AppRoutes.PAYMENT && (
          <Button type="link" onClick={() => router.back()}>
            <LeftOutlined />
            Назад
          </Button>
        )}

        {router.pathname === AppRoutes.PAYMENT && isGlobalAdmin && (
          <EditPaymentButton type="link">
            <PlusOutlined /> Додати
          </EditPaymentButton>
        )}

        {router.pathname !== AppRoutes.PAYMENT && (
          <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT)}>
            Проплати
            <RightOutlined />
          </Button>
        )}

        {isGlobalAdmin && !!selected.length && (
          <Popconfirm
            title={'Ви впевнені що хочете видалити обрані проплати?'}
            onConfirm={handleDelete}
            placement="topRight"
          >
            <Button type="link" danger>
              <DeleteOutlined />
              Видалити
            </Button>
          </Popconfirm>
        )}
      </Space>

      <PaymentsTable
        editable={router.pathname === AppRoutes.PAYMENT}
        extended={router.pathname === AppRoutes.PAYMENT}
        selectable={router.pathname === AppRoutes.PAYMENT}
        filterable={router.pathname === AppRoutes.PAYMENT}
        expandable
        selected={selected}
        onSelect={setSelected}
      />
    </Space>
  )
}
