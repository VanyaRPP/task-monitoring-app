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
  console.log('userino', user, isLoading);

  const [role, setRole] = useState(user?.role)

  const [
    updateUser,
    { isLoading: isUpdating },
  ] = useUpdateUserMutation()

  // useEffect(() => {
  //   const udate = async () => {
  //     await updateUser({ email: user?.email, role: role })
  //   }
  //   udate()
  // }, [role, user])

  const onChange = async (e: RadioChangeEvent) => {
    await updateUser({ email: user?.email, role: `${e.target.value}` })
    setRole(`${e.target.value}`)
  };

  return (
    <>
      {/* <Select >
        <Option value="User">User</Option>
        <Option value="Worker">Worker</Option>
        <Option value="Admin" disabled>Admin</Option>
      </Select> */}
      <Radio.Group
        onChange={onChange}
        defaultValue={user?.role || role}
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