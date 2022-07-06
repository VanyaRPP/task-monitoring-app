import { Space, Button } from 'antd'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../api/userApi/user.api'

import { AppRoutes } from '../utils/constants'
import Router from 'next/router'

export default function Home() {
  const { data: session, status } = useSession()

  const { data, error, isLoading } = useGetUserByEmailQuery(
    `${session?.user?.email}`
  )
  const user = data?.data

  return (
    <div>
      <Space direction="vertical" size="large">
        <h1>Home</h1>
        <p>Helooo: {user?.name}</p>
        <p>site for search work</p>

        <Button onClick={() => Router.push(AppRoutes.DASHBOARD)}>
          Dashboard
        </Button>
      </Space>
    </div>
  )
}
