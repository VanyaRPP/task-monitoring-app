import { SelectOutlined } from '@ant-design/icons'
import React from 'react'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import s from './style.module.scss'

const CustomerCardHeader = () => {
  const Router = useRouter()

  return (
    <div className={s.tableHeader}>
      <Button type="link" onClick={() => Router.push(AppRoutes.CUSTOMER)}>
        Клієнти
        <SelectOutlined className={s.Icon} />
      </Button>
    </div>
  )
}

export default CustomerCardHeader
