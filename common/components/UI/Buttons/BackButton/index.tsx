import { LeftCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

const BackButton = () => {
  const router = useRouter()

  return (
    <LeftCircleOutlined
      onClick={() => router.back()}
      style={{ fontSize: '2rem', color: 'var(--primaryColor)' }}
    />
  )
}

export default BackButton
