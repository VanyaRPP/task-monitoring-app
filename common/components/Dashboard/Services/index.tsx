import {
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useDeleteServiceMutation } from '@common/api/serviceApi/service.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { ServicesTable } from '@common/components/Tables/ServicesTable'
import { EditServiceButton } from '@common/components/UI/Buttons/EditServiceButton'
import { AppRoutes, Roles } from '@utils/constants'
import { Button, Popconfirm, Space, message } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export const Services: React.FC = () => {
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
      message.success('Послуги успішно видалено!')
      setSelected([])
    } catch (error) {
      message.error('При видаленні послуг сталася помилка')
    }
  }, [selected, deleteService])

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ width: '100%' }}>
        {router.pathname === AppRoutes.SERVICE && (
          <Button type="link" onClick={() => router.back()}>
            <LeftOutlined />
            Назад
          </Button>
        )}

        {router.pathname === AppRoutes.SERVICE && isGlobalAdmin && (
          <EditServiceButton type="link">
            <PlusOutlined /> Додати
          </EditServiceButton>
        )}

        {router.pathname !== AppRoutes.SERVICE && (
          <Button type="link" onClick={() => router.push(AppRoutes.SERVICE)}>
            Послуги
            <RightOutlined />
          </Button>
        )}

        {isGlobalAdmin && !!selected.length && (
          <Popconfirm
            title={'Ви впевнені що хочете видалити обрані послуги?'}
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

      <ServicesTable
        editable={router.pathname === AppRoutes.SERVICE}
        extended={router.pathname === AppRoutes.SERVICE}
        selectable={router.pathname === AppRoutes.SERVICE}
        filterable={router.pathname === AppRoutes.SERVICE}
        expandable
        selected={selected}
        onSelect={setSelected}
      />
    </Space>
  )
}
