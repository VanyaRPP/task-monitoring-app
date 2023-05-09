import React from 'react'
import OrganistaionsComponents from '../../OrganistaionsComponents'
import s from './style.module.scss'
import { Table } from 'antd'

const DomainStreetsComponent = ({ data }) => {
  return (
    <div className={s.tableHeader}>
      <Table
        expandable={{
          expandedRowRender: (data) => <OrganistaionsComponents />,
        }}
        dataSource={testData}
        columns={columns}
        pagination={false}
      />
    </div>
  )
}

const columns = [
  {
    title: 'Вулиця',
    dataIndex: 'street',
  },
]

const testData = [
  {
    street: '12 Короленка 12',
  },
]

export default DomainStreetsComponent
