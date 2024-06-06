import {
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useDeleteDomainMutation } from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { CompaniesTable } from '@common/components/Tables/CompaniesTable'
import { EditCompanyButton } from '@common/components/UI/Buttons/EditCompanyButton'
import { AppRoutes, Roles } from '@utils/constants'
import { Button, Popconfirm, Space, message } from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

export const Companies: React.FC = () => {
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
      message.success('Компанії успішно видалено!')
      setSelected([])
    } catch (error) {
      message.error('При видаленні компаній сталася помилка')
    }
  }, [selected, deleteDomain])

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ width: '100%' }}>
        {router.pathname === AppRoutes.REAL_ESTATE && (
          <Button type="link" onClick={() => router.push(AppRoutes.INDEX)}>
            <LeftOutlined />
            Назад
          </Button>
        )}

        {router.pathname === AppRoutes.REAL_ESTATE && isGlobalAdmin && (
          <EditCompanyButton type="link">
            <PlusOutlined /> Додати
          </EditCompanyButton>
        )}

        {router.pathname !== AppRoutes.REAL_ESTATE && (
          <Button
            type="link"
            onClick={() => router.push(AppRoutes.REAL_ESTATE)}
          >
            Компанії
            <RightOutlined />
          </Button>
        )}

        {/* TODO: EditServiceModal form multiple companies */}
        {/* {!!selected.length && (
          <Button type="link" danger>
            <MailFilled />
            Виставити рахунок
          </Button>
        )} */}

        {isGlobalAdmin && !!selected.length && (
          <Popconfirm
            title={'Ви впевнені що хочете видалити обрані компанії?'}
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

      <CompaniesTable
        editable={router.pathname === AppRoutes.REAL_ESTATE}
        extended={router.pathname === AppRoutes.REAL_ESTATE}
        selectable={router.pathname === AppRoutes.REAL_ESTATE}
        filterable={router.pathname === AppRoutes.REAL_ESTATE}
        expandable
        selected={selected}
        onSelect={setSelected}
      />
    </Space>
  )
}
