import { Radio } from 'antd'
import type { RadioChangeEvent } from 'antd'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import {
  useGetUserByEmailQuery,
  useUpdateUserMutation,
} from '../../api/userApi/user.api'

const RoleSwither = () => {
  const { data: session } = useSession()
  const { data, error, isLoading } = useGetUserByEmailQuery(
    `${session?.user?.email}`
  )
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  const user = data?.data

  const [role, setRole] = useState<string>(user?.role)

  useEffect(() => {
    setRole(user?.role)
  }, [user?.role])

  const onChange = async (e: RadioChangeEvent) => {
    await updateUser({ email: user?.email, role: `${e.target.value}` })
  }

  return (
    <>
      <Radio.Group
        disabled={isUpdating}
        onChange={onChange}
        value={role}
        style={{ width: '100%' }}
        buttonStyle="solid"
      >
        <Radio.Button value="User">User</Radio.Button>
        <Radio.Button value="Worker">Worker</Radio.Button>
        <Radio.Button value="Admin" disabled>
          Admin
        </Radio.Button>
      </Radio.Group>
    </>
  )
}

export default RoleSwither
