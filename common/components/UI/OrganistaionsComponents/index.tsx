import React from 'react'
import s from './style.module.scss'
import { Table } from 'antd'

const OrganistaionsComponents = () => {
  return (
    <div className={s.tableHeader}>
      <Table dataSource={testData} columns={columns} pagination={false} />
    </div>
  )
}

const columns = [
  {
    title: 'Назва',
    dataIndex: 'name',
  },
  {
    title: 'Адреса',
    dataIndex: 'street',
  },
  {
    title: 'Платник',
    dataIndex: 'bankInformation',
  },
  {
    title: 'Телефон',
    dataIndex: 'phone',
  },
  {
    title: 'Адміністратори',
    dataIndex: 'adminEmails',
  },
  {
    title: 'Договір',
    dataIndex: 'agreement',
  },
]

const testData = [
  {
    name: 'DEU',
    street: 'Мала Бердичівська 17',
    bankInformation: 'ТОВ Укр',
    phone: '22-22-2211',
    adminEmails: ['asdasa@dsad.scos'],
    agreement: 'N3 2323sd 2019',
  },
]

export default OrganistaionsComponents
