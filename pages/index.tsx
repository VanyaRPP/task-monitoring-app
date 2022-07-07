import { Space, Button } from 'antd'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../api/userApi/user.api'
import React from 'react'
import HomePage from '../components/HomePage'

import { AppRoutes } from '../utils/constants'
import Router from 'next/router'

export default function Home() {
  const { data: session, status } = useSession()

  const { data, error, isLoading } = useGetUserByEmailQuery(
    `${session?.user?.email}`
  )
  const user = data?.data

  return (
    <Space direction="vertical" size="large">
      <HomePage />
      <Button onClick={() => Router.push(AppRoutes.DASHBOARD)}>
          Dashboard
        </Button>
    </Space>
  )
}
