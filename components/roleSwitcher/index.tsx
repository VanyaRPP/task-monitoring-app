import { Select } from 'antd'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { useGetUserByEmailQuery, useUpdateUserMutation } from '../../api/userApi/user.api'

const { Option } = Select;

const RoleSwither = () => {
  const { data: session } = useSession()
  const { data, error, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data


  const [role, setRole] = useState(user?.role)

  const [
    updateUser,
    { isLoading: isUpdating },
  ] = useUpdateUserMutation()

  useEffect(() => {
    const udate = async () => {
      await updateUser({ email: user?.email, role: role })
    }
    udate()
  }, [role, user])

  const handleChange = (value: string) => {
    setRole(`${value}`);
  };

  return (
    <>
      <Select defaultValue={role} style={{ width: '100%' }} onChange={handleChange}>
        <Option value="User">User</Option>
        <Option value="Worker">Worker</Option>
        <Option value="Admin" disabled>Admin</Option>
      </Select>
    </>
  )
}

export default RoleSwither