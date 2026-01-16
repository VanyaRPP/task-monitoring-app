import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Avatar, Card, Table, Select, message } from 'antd'
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
  const r = u?.roles ?? u?.role
  if (Array.isArray(r)) {
    if (r.includes(Roles.GLOBAL_ADMIN)) return Roles.GLOBAL_ADMIN
    if (r.includes(Roles.DOMAIN_ADMIN)) return Roles.DOMAIN_ADMIN
    if (r.includes(Roles.USER)) return Roles.USER
    return r[0] ?? Roles.USER
  }
  return r ?? Roles.USER
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

  const isGlobalAdmin = useMemo(() => {
    const role = (currentUser as any)?.roles || (currentUser as any)?.role
    return (
      role === Roles.GLOBAL_ADMIN ||
      (Array.isArray(role) && role.includes(Roles.GLOBAL_ADMIN))
    )
  }, [currentUser])

  useEffect(() => {
    if (isCurrentUserLoading) return
    if (!isGlobalAdmin) router.replace(AppRoutes.INDEX)
  }, [isCurrentUserLoading, isGlobalAdmin, router])

  const [pageSize, setPageSize] = useState<number>(10)

  const columns = useMemo<ColumnsType<IUser>>(
    () => [
      {
        title: 'Аватар',
        key: 'avatar',
        width: 120,
        render: (_: any, user) => {
          const name = user?.name || user?.email || '?'
          const image = user?.image

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
        title: "Ім'я",
        dataIndex: 'name',
        key: 'name',
        render: (_: any, user) =>
          (user as any)?.name || (user as any)?.fullName || '—',
      },
      {
        title: 'Імейл',
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
                  refetchUsers()
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
    ],
    [isGlobalAdmin, updateUser, refetchUsers, isUpdatingUser, updatingUserId]
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
          dataSource={users}
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
