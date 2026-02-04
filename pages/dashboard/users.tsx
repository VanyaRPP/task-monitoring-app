import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Avatar, Card, Table, Select, message, Input, Button } from 'antd'
import { SearchOutlined, EditOutlined } from '@ant-design/icons'
import type { SelectProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import MainLayout from '@common/components/Layouts/Main'
import { AppRoutes, Roles } from '@utils/constants'
import {
  useGetAllUsersQuery,
  useGetCurrentUserQuery,
  useUpdateUserMutation,
} from '@common/api/userApi/user.api'
import type { IUser } from '@common/api/userApi/user.api.types'
import Head from 'next/head'
import { EditUserModal } from '@common/components/EditUserModal'

const getAvatarGradient = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360

  return `linear-gradient(135deg,
    hsl(${hue}, 70%, 55%),
    hsl(${(hue + 40) % 360}, 80%, 65%)
  )`
}
const ROLE_OPTIONS: SelectProps['options'] = [
  { value: Roles.GLOBAL_ADMIN, label: 'Global Admin' },
  { value: Roles.DOMAIN_ADMIN, label: 'Domain Admin' },
  { value: Roles.USER, label: 'User' },
]

const getUserRoleValue = (u: any): string => {
  if (u?.role) return u.role
  return u?.roles?.[0] ?? Roles.USER
}

export const EditUserButton: React.FC<{ userId?: string }> = ({ userId }) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
      <Button
        type="link"
        icon={<EditOutlined />}
        onClick={() => setOpen(true)}
      />
      <EditUserModal
        open={open}
        userId={userId}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

export default function UsersPage() {
  const router = useRouter()

  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useGetCurrentUserQuery()

  const {
    data: users = [],
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useGetAllUsersQuery()

  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [searchName, setSearchName] = useState<string>('')
  const [searchEmail, setSearchEmail] = useState<string>('')

  const isGlobalAdmin = useMemo(() => {
    const role = getUserRoleValue(currentUser as any)
    return role === Roles.GLOBAL_ADMIN
  }, [currentUser])

  useEffect(() => {
    if (isCurrentUserLoading) return
    if (!isGlobalAdmin) router.replace(AppRoutes.INDEX)
  }, [isCurrentUserLoading, isGlobalAdmin, router])

  const [pageSize, setPageSize] = useState<number>(10)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = (
        (user as any)?.name ||
        (user as any)?.fullName ||
        ''
      ).toLowerCase()
      const email = ((user as any)?.email || '').toLowerCase()

      const matchesName = name.includes(searchName.toLowerCase())
      const matchesEmail = email.includes(searchEmail.toLowerCase())

      return matchesName && matchesEmail
    })
  }, [users, searchName, searchEmail])

  const columns = useMemo<ColumnsType<IUser>>(
    () => [
      {
        title: 'Аватар',
        key: 'avatar',
        width: 120,
        render: (_: any, user) => {
          const name = user?.name || user?.email || '?'
          const image = (user as any)?.image

          const DEFAULT_AVATAR =
            'https://avatars.githubusercontent.com/u/583231?v=4'

          const isDefaultAvatar = !image || image === DEFAULT_AVATAR

          return (
            <Avatar
              size={40}
              src={isDefaultAvatar ? undefined : image}
              style={
                isDefaultAvatar
                  ? {
                      background: getAvatarGradient(name),
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 18,
                    }
                  : undefined
              }
            >
              {isDefaultAvatar ? name[0].toUpperCase() : null}
            </Avatar>
          )
        },
      },
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{`Ім'я`}</span>
            <Input
              placeholder="Пошук по імені"
              prefix={<SearchOutlined />}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              allowClear
              style={{ width: 200 }}
            />
          </div>
        ),
        dataIndex: 'name',
        key: 'name',
        render: (_: any, user) =>
          (user as any)?.name || (user as any)?.fullName || '—',
      },
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Імейл</span>
            <Input
              placeholder="Пошук по email"
              prefix={<SearchOutlined />}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              allowClear
              style={{ width: 200 }}
            />
          </div>
        ),
        dataIndex: 'email',
        key: 'email',
        render: (email: any) => email || '—',
      },
      {
        title: 'Роль',
        dataIndex: 'roles',
        key: 'roles',
        render: (_: any, user) => {
          const currentRole = getUserRoleValue(user as any)
          const disabled = !isGlobalAdmin

          return (
            <Select
              style={{ minWidth: 170 }}
              options={ROLE_OPTIONS}
              value={currentRole}
              disabled={disabled}
              loading={updatingUserId === (user as any)?._id && isUpdatingUser}
              onChange={async (nextRole) => {
                try {
                  setUpdatingUserId((user as any)?._id)
                  await updateUser({
                    _id: (user as any)?._id,
                    roles: [nextRole],
                  }).unwrap()

                  message.success('Роль оновлено')
                } catch (e) {
                  message.error('Не вдалося оновити роль')
                } finally {
                  setUpdatingUserId(null)
                }
              }}
            />
          )
        },
      },
      {
        title: 'Пароль',
        key: 'password',
        width: 140,
        align: 'center',
        render: (_: any, user) => {
          const hasPassword =
            Boolean((user as any)?.password) ||
            Boolean((user as any)?.passwordHash) ||
            Boolean((user as any)?.hasPassword)

          return hasPassword ? '••••••' : '—'
        },
      },
      {
        key: 'actions',
        fixed: 'right',
        width: 48,
        render: (_: any, user) => (
          <EditUserButton userId={(user as any)?._id?.toString()} />
        ),
      },
    ],
    [
      isGlobalAdmin,
      updateUser,
      refetchUsers,
      isUpdatingUser,
      updatingUserId,
      searchName,
      searchEmail,
    ]
  )

  return (
    <>
      <Head>
        <title>Користувачі</title>
      </Head>
      <MainLayout
        path={[
          { title: 'Панель управління', path: AppRoutes.INDEX },
          { title: 'Всі таблиці', path: AppRoutes.TABLES },
          { title: 'Користувачі', path: AppRoutes.USERS },
        ]}
      >
        <Card style={{ width: '100%' }}>
          <Table<IUser>
            rowKey="_id"
            loading={isUsersLoading || isCurrentUserLoading}
            dataSource={filteredUsers}
            columns={columns}
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              position: ['bottomCenter'],
              onShowSizeChange: (_current, size) => setPageSize(size),
            }}
            scroll={{ x: 900 }}
          />
        </Card>
      </MainLayout>
    </>
  )
}
