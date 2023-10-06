import React from 'react'
import s from './style.module.scss'
import { Table } from 'antd'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

const OrganistaionsComponents = ({ domainId, streetId }) => {
  const { data: realEstates, isLoading } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })

  return (
    <div className={s.tableHeader}>
      <Table
        loading={isLoading}
        dataSource={domainId && streetId ? realEstates?.data : null}
        columns={columns}
        pagination={false}
      />
    </div>
  )
}

const columns = [
  {
    title: 'Назва',
    dataIndex: 'companyName',
  },
  {
    title: 'Адміністратори',
    dataIndex: 'adminEmails',
  },
  {
    title: 'Опис',
    dataIndex: 'description',
  },
]

export default OrganistaionsComponents
