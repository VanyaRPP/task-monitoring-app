import React from 'react'
import { Table, Alert } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import { ICustomService } from '@common/api/customServicesApi/customServices.api.types'

export interface Props {
  serviceId?: string
}
const MyServicesTable: React.FC<Props> = ({ 
  serviceId
}) => {

  const { 
    data: customServicesData, isLoading, isError,} = useGetCustomServicesQuery({
    _id: serviceId ? [serviceId] : undefined
  })

  const tableData: ICustomService[] = customServicesData?.data || []

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />


  return (
    <div>
      <Table
        rowKey="_id"
        dataSource={tableData}
        loading={isLoading}
        columns={getTableColumns()}
        scroll={{ x: 600 }}
        locale={{ emptyText: 'Немає доступних кастомних сервісів' }}
        pagination={false}
      />
    </div>
  )
}

const getTableColumns = (): ColumnType<ICustomService>[] => [
  {
    title: 'Назва сервісу',
    dataIndex: 'name',
    key: 'name',
    width: '100%',
    render: (name: string) => name
  },
]

export default MyServicesTable
