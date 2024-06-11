import { useGetRealEstatesQuery } from '@common/api/realestateApi/realestate.api'
import { Table } from 'antd'
import s from './style.module.scss'

const OrganistaionsComponents = ({ domainId, streetId }) => {
  const { data: realEstates, isLoading } = useGetRealEstatesQuery({
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
