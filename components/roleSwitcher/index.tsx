import { Select, Radio } from 'antd'
import type { RadioChangeEvent } from 'antd'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { useGetUserByEmailQuery, useUpdateUserMutation } from '../../api/userApi/user.api'

const { Option } = Select;

const RoleSwither = () => {

  const { data: session } = useSession()
  const { data, error, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  const [role, setRole] = useState('')

  const [
    updateUser,
    { isLoading: isUpdating },
  ] = useUpdateUserMutation()

  // useEffect(() => {

  // }, [data])

  const onChange = async (e: RadioChangeEvent) => {
    await updateUser({ email: user?.email, role: `${e.target.value}` })
    // setRole(user?.role)
  };

  return (
    <>
      {/* <Select >
        <Option value="User">User</Option>
        <Option value="Worker">Worker</Option>
        <Option value="Admin" disabled>Admin</Option>
      </Select> */}
      <Radio.Group
        disabled={isUpdating}
        onChange={onChange}
        defaultValue={user?.role}
        style={{ width: '100%' }}
        buttonStyle="solid">
        <Radio.Button value="User">User</Radio.Button>
        <Radio.Button value="Worker">Worker</Radio.Button>
        <Radio.Button value="Admin" disabled>Admin</Radio.Button>
      </Radio.Group>
    </>
  )
}

export default RoleSwither