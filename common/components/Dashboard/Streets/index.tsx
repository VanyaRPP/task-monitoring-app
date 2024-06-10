import {
  DeleteOutlined,
  LeftOutlined,
  MergeCellsOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useDeleteStreetMutation } from '@common/api/streetApi/street.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { StreetsTable } from '@common/components/Tables/StreetsTable'
import { EditDomainButton } from '@common/components/UI/Buttons/EditDomainButton'
import { EditStreetButton } from '@common/components/UI/Buttons/EditStreetButton'
import { AppRoutes, Roles } from '@utils/constants'
import { Button, Popconfirm, Space, message } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export const Streets: React.FC = () => {
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
          <Button type="link" onClick={() => router.back()}>
            <LeftOutlined />
            Назад
          </Button>
        )}

        {router.pathname === AppRoutes.STREETS && isGlobalAdmin && (
          <EditStreetButton type="link">
            <PlusOutlined /> Додати
          </EditStreetButton>
        )}

        {isGlobalAdmin && !!selected.length && (
          <EditDomainButton streets={selected} type="link">
            <MergeCellsOutlined /> Групувати
          </EditDomainButton>
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
        editable={router.pathname === AppRoutes.STREETS}
        extended={router.pathname === AppRoutes.STREETS}
        selectable={router.pathname === AppRoutes.STREETS}
        filterable={router.pathname === AppRoutes.STREETS}
        expandable
        selected={selected}
        onSelect={setSelected}
      />
    </Space>
  )
}
