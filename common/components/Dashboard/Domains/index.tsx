import {
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useDeleteDomainMutation } from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { DomainsTable } from '@common/components/Tables/DomainsTable'
import { EditDomainButton } from '@common/components/UI/Buttons/EditDomainButton'
import { AppRoutes, Roles } from '@utils/constants'
import { Button, Popconfirm, Space, message } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export const Domains: React.FC = () => {
  const router = useRouter()

  const { data: user } = useGetCurrentUserQuery()

  const isGlobalAdmin = useMemo(
    () => user?.roles?.includes(Roles.GLOBAL_ADMIN),
    [user]
  )

  const [selected, setSelected] = useState<string[]>([])

  const [deleteDomain] = useDeleteDomainMutation()

  const handleDelete = useCallback(async () => {
    try {
      await Promise.all(selected.map((id) => deleteDomain(id).unwrap()))
      message.success('Надавачів послуг успішно видалено!')
      setSelected([])
    } catch (error) {
      message.error('При видаленні надавачів послуг сталася помилка')
    }
  }, [selected, deleteDomain])

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ width: '100%' }}>
        {router.pathname === AppRoutes.DOMAIN && (
          <Button type="link" onClick={() => router.back()}>
            <LeftOutlined />
            Назад
          </Button>
        )}

        {router.pathname === AppRoutes.DOMAIN && isGlobalAdmin && (
          <EditDomainButton type="link">
            <PlusOutlined /> Додати
          </EditDomainButton>
        )}

        {router.pathname !== AppRoutes.DOMAIN && (
          <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
            Надавачі послуг
            <RightOutlined />
          </Button>
        )}

        {isGlobalAdmin && !!selected.length && (
          <Popconfirm
            title={'Ви впевнені що хочете видалити обраних надавачів послуг?'}
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

      <DomainsTable
        editable={router.pathname === AppRoutes.DOMAIN}
        extended={router.pathname === AppRoutes.DOMAIN}
        selectable={router.pathname === AppRoutes.DOMAIN}
        filterable={router.pathname === AppRoutes.DOMAIN}
        expandable
        selected={selected}
        onSelect={setSelected}
      />
    </Space>
  )
}
