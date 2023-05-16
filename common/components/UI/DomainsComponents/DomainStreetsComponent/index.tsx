import React from 'react'
import s from './style.module.scss'
import { Button } from 'antd'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'

const DomainStreetsComponent = ({ data }) => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router

  return (
    <div className={s.tableHeader}>
      <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
        Домени
        <SelectOutlined className={s.Icon} />
      </Button>

      <Button type="link">
        <PlusOutlined /> Додати
      </Button>
    </div>
  )
}
export default DomainStreetsComponent
