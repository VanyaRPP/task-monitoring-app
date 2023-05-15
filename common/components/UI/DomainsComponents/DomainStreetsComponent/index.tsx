import React from 'react'
import s from './style.module.scss'
import { Button } from 'antd'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'

const DomainStreetsComponent = ({ data }) => {
  return (
    <div className={s.tableHeader}>
      <Button type="link">
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
