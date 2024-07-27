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
import { Button, Card, Flex, message, Popconfirm, Space } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export const Domains: React.FC = () => {
  const router = useRouter()

  const { data: user } = useGetCurrentUserQuery()

  const isGlobalAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.GLOBAL_ADMIN)
  }, [user])

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
    <Card
      styles={{
        body: {
          padding: 0,
        },
      }}
      title={
        <Flex justify="space-between" align="center">
          {router.pathname === AppRoutes.DOMAIN && (
            <Button
              type="link"
              onClick={() => router.push(AppRoutes.INDEX)}
              icon={<LeftOutlined />}
            >
              Назад
            </Button>
          )}

          {router.pathname !== AppRoutes.DOMAIN && (
            <Button
              type="link"
              onClick={() => router.push(AppRoutes.DOMAIN)}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Надавачі послуг
            </Button>
          )}

          <Space>
            {isGlobalAdmin && !!selected.length && (
              <Popconfirm
                title={
                  'Ви впевнені що хочете видалити обраних надавачів послуг?'
                }
                onConfirm={handleDelete}
                placement="topRight"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Видалити
                </Button>
              </Popconfirm>
            )}

            {router.pathname === AppRoutes.DOMAIN && isGlobalAdmin && (
              <EditDomainButton type="link" icon={<PlusOutlined />}>
                Додати
              </EditDomainButton>
            )}
          </Space>
        </Flex>
      }
    >
      <DomainsTable
        editable={router.pathname === AppRoutes.DOMAIN}
        extended={router.pathname === AppRoutes.DOMAIN}
        selectable={router.pathname === AppRoutes.DOMAIN}
        filterable={router.pathname === AppRoutes.DOMAIN}
        // expandable
        onSelect={setSelected}
      />
    </Card>
  )
}
