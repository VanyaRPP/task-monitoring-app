import { Space } from 'antd'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../api/userApi/user.api'
import React from 'react'
import HomePage from '../components/HomePage'

export default function Home() {
  const { data: session, status } = useSession()

  const { data, error, isLoading } = useGetUserByEmailQuery(
    `${session?.user?.email}`
  )
  const user = data?.data

  return (
    <Space direction="vertical" size="large">
      <HomePage />
    </Space>
  )
}
