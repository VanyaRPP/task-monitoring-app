import { LeftCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

const BackButton = () => {

  const router = useRouter()

  return (
    <Button
      onClick={() => router.back()}
    >
      <LeftCircleOutlined />
    </Button>
  )
}

export default BackButton