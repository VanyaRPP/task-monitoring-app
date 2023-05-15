import React, { useState } from 'react'
import s from './style.module.scss'
import { Table } from 'antd'
import { Button } from 'antd'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'

const DomainStreetsComponent = ({ data }) => {
  const Router = useRouter()
  const [isModalDomainOpen, setIsModalDomainOpen] = useState(false)

  const closeModal = () => {
    setIsModalDomainOpen(false)
  }

  return (
    <div className={s.tableHeader}>
      <Button type="link">
        Домени
        <SelectOutlined className={s.Icon} />
      </Button>
      <Button type="link" onClick={() => setIsModalDomainOpen(true)}>
        <PlusOutlined /> Додати
      </Button>
      {/* <Table
        expandable={{
          expandedRowRender: (data) => <OrganistaionsComponents />,
        }}
        dataSource={testData}
        columns={columns}
        pagination={false}
      /> */}
    </div>
  )
}

// const columns = [
//   {
//     title: 'Вулиця',
//     dataIndex: 'street',
//   },
// ]

// const testData = [
//   {
//     street: '12 Короленка 12',
//   },
// ]

export default DomainStreetsComponent
