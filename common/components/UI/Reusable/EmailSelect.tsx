import { validateField } from '@assets/features/validators'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import {
  useGetAllUsersQuery,
  useGetCurrentUserQuery,
} from '@common/api/userApi/user.api'
import { Avatar, Form, Select, Tooltip } from 'antd'
import type { CustomTagProps } from 'rc-select/lib/BaseSelect'
import { useMemo } from 'react'
import { CloseOutlined } from '@ant-design/icons'

interface EmailSelectProps {
  form: any
  disabled?: boolean
  required?: boolean
}

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

export default function EmailSelect({
  form,
  disabled = false,
  required = true,
}: EmailSelectProps) {
  const { data: domains, isLoading: isDomainsLoading } = useGetDomainsQuery({})
  const { data: users = [], isLoading: isUsersLoading } = useGetAllUsersQuery()

  const { data: currentUser } = useGetCurrentUserQuery()
  const currentUserEmail = currentUser?.email?.toLowerCase()

  const adminEmails: string[] = useMemo(() => {
    const set = new Set<string>()
    ;(domains || []).forEach((d: any) => {
      ;(d?.adminEmails || []).forEach((e: any) => {
        const email = (e || '').toString().trim()
        if (email) set.add(email)
      })
    })
    return Array.from(set)
  }, [domains])

  const userByEmail = useMemo(() => {
    const map = new Map<string, any>()
    ;(users || []).forEach((u: any) => {
      const email = (u?.email || '').toString().toLowerCase().trim()
      if (email) map.set(email, u)
    })
    return map
  }, [users])

  const options = useMemo(() => {
    return adminEmails.map((email) => {
      const u = userByEmail.get(email.toLowerCase())
      const name = u?.name || u?.fullName || ''
      const image = u?.image

      const DEFAULT_AVATAR =
        'https://avatars.githubusercontent.com/u/583231?v=4'
      const isDefaultAvatar = !image || image === DEFAULT_AVATAR

      const seed = name || email || '?'
      const searchText = `${email} ${name}`.toLowerCase().trim()

      return {
        value: email,
        searchText,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              size={24}
              src={isDefaultAvatar ? undefined : image}
              style={
                isDefaultAvatar
                  ? {
                      background: getAvatarGradient(seed),
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 12,
                      flex: '0 0 auto',
                    }
                  : undefined
              }
            >
              {isDefaultAvatar ? seed[0]?.toUpperCase?.() : null}
            </Avatar>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1.15,
              }}
            >
              <span style={{ fontWeight: 600 }}>{name || '—'}</span>
              <span style={{ opacity: 0.85 }}>{email}</span>
            </div>
          </div>
        ),
      }
    })
  }, [adminEmails, userByEmail])

  const isLoading = isDomainsLoading || isUsersLoading
  const tagRender = (props: CustomTagProps) => {
    const { label, value, closable, onClose } = props
    const isSelf = value?.toString().toLowerCase() === currentUserEmail

    const tagContent = (
      <span
        className="ant-select-selection-item"
        style={{
          cursor: isSelf ? 'not-allowed' : 'default',
        }}
      >
        <span className="ant-select-selection-item-content">{label}</span>
        {closable && !isSelf && (
          <span
            className="ant-select-selection-item-remove"
            onClick={onClose}
            onMouseDown={(e) => e.preventDefault()}
          >
            <CloseOutlined style={{ fontSize: 10 }} />
          </span>
        )}
      </span>
    )
    if (isSelf) {
      return (
        <Tooltip title="Неможливо видалити самого себе">{tagContent}</Tooltip>
      )
    }
    return tagContent
  }

  return (
    <Form.Item
      name="adminEmails"
      label="Адміністратори"
      required={required}
      rules={[{ required }, ...(required ? validateField('email') : [])]}
    >
      <Select
        mode="tags"
        showSearch
        options={options as any}
        disabled={isLoading || disabled}
        placeholder="Пошти адмінів компанії"
        loading={isLoading}
        optionLabelProp="value"
        tagRender={tagRender}
        filterOption={(input, option: any) => {
          const q = (input || '').toLowerCase()
          return (option?.searchText || '').includes(q)
        }}
      />
    </Form.Item>
  )
}
