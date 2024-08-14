import {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
} from '@common/api/userApi/user.api'
import useDebounce from '@modules/hooks/useDebounce'
import { Roles } from '@utils/constants'
import { isEqual } from '@utils/helpers'
import { message, Select, SelectProps, Tag } from 'antd'
import { useCallback, useEffect, useState } from 'react'

export type RolesSelectorProps = Omit<SelectProps, 'options' | 'mode'>

const options = [
  {
    value: Roles.GLOBAL_ADMIN,
  },
  {
    value: Roles.DOMAIN_ADMIN,
  },
  {
    value: Roles.USER,
  },
]

export const RolesSelector: React.FC<RolesSelectorProps> = ({ ...props }) => {
  const { data: user } = useGetCurrentUserQuery()
  const [updateUser] = useUpdateUserMutation()

  const [value, setValue] = useState<Roles[]>(user?.roles as Roles[])
  const debouncedValue = useDebounce(value, 1000)

  const handleUpdate = useCallback(
    (roles: Roles[]) => {
      if (process.env.NODE_ENV !== 'development') {
        return message.error('Only for developers!')
      }

      if (!user) {
        return message.error('Unknown user!')
      }

      if (!isEqual(user.roles, roles)) {
        updateUser({ _id: user._id, roles })
          .then(() => message.success('Roles updated!'))
          .catch(() => message.error('Failed to update roles!'))
      }
    },
    [user, updateUser]
  )

  useEffect(() => {
    handleUpdate(debouncedValue)
  }, [debouncedValue, handleUpdate])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Select
      mode="multiple"
      options={options}
      value={value}
      onChange={setValue}
      placeholder="Roles..."
      showSearch
      optionFilterProp="label"
      maxTagCount={1}
      tagRender={({ label }) => (
        <Tag color="purple" bordered={false}>
          {label}
        </Tag>
      )}
      {...props}
    />
  )
}
