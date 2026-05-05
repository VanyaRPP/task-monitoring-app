import { useMemo, useState } from 'react'
import { Avatar, Card, Table, Select, message, Input, Button } from 'antd'
import { SearchOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { SelectProps } from 'antd'

import {
  useGetAllUsersQuery,
  useUpdateUserMutation,
  useGetCurrentUserQuery 
} from '@common/api/userApi/user.api'
import type { IUser } from '@common/api/userApi/user.api.types'
import type { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { Roles } from '@utils/constants'
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

const ROLE_FILTER_OPTIONS: SelectProps['options'] = [
  { value: 'all', label: 'Усі' },
  { value: Roles.GLOBAL_ADMIN, label: 'Global Admin' },
  { value: Roles.DOMAIN_ADMIN, label: 'Domain Admin' },
  { value: Roles.USER, label: 'User' },
]

const getUserRoleValue = (u: any): string =>
  u?.role ?? u?.roles?.[0] ?? Roles.USER

const EditUserButton: React.FC<{ userId?: IUser['_id'] }> = ({ userId }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="link"
        icon={<EditOutlined />}
        onClick={() => setOpen(true)}
      />
      <EditUserModal
        open={open}
        userId={userId?.toString()}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

interface Props {
  domains?: IExtendedDomain[]
  isDomainAdmin?: boolean
}

export const UsersTable: React.FC<Props> = ({domains = [],isDomainAdmin = false, }) => {
  const { data: currentUser } = useGetCurrentUserQuery()
  const { data: users = [], isLoading } = useGetAllUsersQuery()
  const [updateUser, { isLoading: isUpdatingUser }] =
    useUpdateUserMutation()

  const [updatingUserId, setUpdatingUserId] = useState<IUser['_id'] | null>(null)
  const [searchName, setSearchName] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [searchRole, setSearchRole] = useState<string>('all')
  const [pageSize, setPageSize] = useState(10)

  const domainAdminEmails = useMemo(() => {
    if (!isDomainAdmin) return null
    return domains.flatMap(d => d.adminEmails)
  }, [domains, isDomainAdmin])

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const name =
          ((user as any)?.name || (user as any)?.fullName || '').toLowerCase()
        const email = ((user as any)?.email || '').toLowerCase()
        const userRole = getUserRoleValue(user)
        const matchesName = name.includes(searchName.toLowerCase())
        const matchesEmail = email.includes(searchEmail.toLowerCase())
        const matchesRole = searchRole === 'all' || userRole === searchRole

        const matchesDomain =
          !isDomainAdmin ||
          domainAdminEmails?.includes(user.email)

        return matchesName && matchesEmail && matchesRole && matchesDomain
      }),
    [users, searchName, searchEmail, searchRole, isDomainAdmin, domainAdminEmails]
  )

  const columns = useMemo<ColumnsType<IUser>>(
    () => [
      {
        title: '',
        width: 70,
        align: 'center',
        render: (_, user) => {
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
              allowClear
              style={{ width: 200 }}
            />
          </div>
        ),
        render: (_, user) =>
          (user as any)?.name || (user as any)?.fullName || '—',
      },
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Email
            <Input
              placeholder="Пошук по email"
              prefix={<SearchOutlined />}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />
          </div>
        ),
        dataIndex: 'email',
      },
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Роль
            {!isDomainAdmin && (
            <Select
              placeholder="Пошук по ролям"
              value={searchRole}
              onChange={(value) => setSearchRole(value)}
              options={ROLE_FILTER_OPTIONS}
              style={{ width: 170 }}
              allowClear
              onClear={() => setSearchRole('all')}
            />
              )}
          </div>
        ),
        render: (_, user) => {
          const currentRole = getUserRoleValue(user)
           if (isDomainAdmin) {
    return currentRole
  }
          const isSelf = currentUser?._id?.toString() === user?._id?.toString()
          const isGlobalAdminUser = currentRole === Roles.GLOBAL_ADMIN
          if (isSelf && isGlobalAdminUser) {
            return 'Global Admin'
          }

          return (
            <Select
              style={{ minWidth: 170 }}
              options={ROLE_OPTIONS}
              value={currentRole}
              loading={
                updatingUserId?.toString() === user._id?.toString() &&
                isUpdatingUser
              }
              onChange={async (nextRole) => {
                try {
                  setUpdatingUserId(user._id)
                  await updateUser({
                    _id: user._id,
                    roles: [nextRole],
                  }).unwrap()

                  message.success('Роль оновлено')
                } catch {
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
      searchName,
      searchEmail,
      searchRole,
      isUpdatingUser,
      updatingUserId,
      updateUser,
      currentUser
    ]
  )

  return (
      <Table<IUser>
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filteredUsers}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          position: ['bottomCenter'],
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
        scroll={{ x: 900 }}
      />
  )
}