import React from 'react'
import s from './style.module.scss'
import { Table } from 'antd'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'

const OrganistaionsComponents = ({ domainId, streetId }) => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router
  const { data: realEstates, isLoading } = useGetAllRealEstateQuery({
    limit: pathname === AppRoutes.DOMAIN ? 200 : 5,
    domainId,
    streetId
  })

  return (
    <div className={s.tableHeader}>
      <Table
        loading={isLoading}
        dataSource={realEstates}
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
