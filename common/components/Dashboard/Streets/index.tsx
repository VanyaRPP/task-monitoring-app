import {
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useDeleteStreetMutation } from '@common/api/streetApi/street.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { StreetsTable } from '@common/components/Tables/StreetsTable'
import { EditStreetButton } from '@common/components/UI/Buttons/EditStreetButton'
import { AppRoutes, Roles } from '@utils/constants'
import { Button, Popconfirm, Space, message } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export interface DashboardStreetsProps {
  domain?: string
}

export const Streets: React.FC<DashboardStreetsProps> = ({
  domain: domainId,
}) => {
  const router = useRouter()

  const { data: user } = useGetCurrentUserQuery()

  const isGlobalAdmin = useMemo(
    () => user?.roles?.includes(Roles.GLOBAL_ADMIN),
    [user]
  )

  const [selected, setSelected] = useState<string[]>([])

  const [deleteStreet] = useDeleteStreetMutation()

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selected.map((id) => deleteStreet(id).unwrap()))
      message.success('Вулиці успішно видалено!')
      setSelected([])
    } catch (error) {
      message.error('При видаленні вулиць сталася помилка')
    }
  }, [selected, deleteStreet])

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ width: '100%' }}>
        {router.pathname === AppRoutes.STREETS && (
          <Button type="link" onClick={() => router.push(AppRoutes.INDEX)}>
            <LeftOutlined />
            Назад
          </Button>
        )}

        {router.pathname === AppRoutes.STREETS && isGlobalAdmin && (
          <EditStreetButton type="link">
            <PlusOutlined /> Додати
          </EditStreetButton>
        )}

        {router.pathname !== AppRoutes.STREETS && (
          <Button type="link" onClick={() => router.push(AppRoutes.STREETS)}>
            Вулиці
            <RightOutlined />
          </Button>
        )}

        {isGlobalAdmin && !!selected.length && (
          <Popconfirm
            title={'Ви впевнені що хочете видалити обрані вулиці?'}
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

      <StreetsTable
        domain={domainId}
        editable={router.pathname === AppRoutes.STREETS}
        selected={selected}
        onSelect={(streets) => setSelected(streets)}
      />
    </Space>
  )
}
