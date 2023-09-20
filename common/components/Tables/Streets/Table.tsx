import { DeleteOutlined } from '@ant-design/icons'
import { Alert, Popconfirm, Table, message, Pagination } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import {
  useDeleteStreetMutation,
  useGetAllStreetsQuery,
} from '@common/api/streetApi/street.api'
import { IStreet } from '@common/modules/models/Street'
import { AppRoutes } from '@utils/constants'
import RealEstateBlock from '@common/components/DashboardPage/blocks/realEstates'
import { useState } from 'react'

export interface Props {
  domainId?: string
}

const StreetsTable: React.FC<Props> = ({ domainId }) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.STREETS
  
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const { data: fetchedStreets, isLoading, isError } = useGetAllStreetsQuery({ domainId, page: page, limit: isOnPage ? undefined : 5 })
  
  const [deleteStreet, { isLoading: deleteLoading }] = useDeleteStreetMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteStreet(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
      <Table
        rowKey="_id"
        size="small"
        pagination={
          !isOnPage && {
            responsive: false,
            size: 'small',
            total: fetchedStreets?.total,
            onChange: (page) => {
              setPage(page)
            },
            pageSize: pageSize,
            position: ['bottomCenter'],
            hideOnSinglePage: true,
          }
        }
        loading={isLoading}
        columns={getDefaultColumns(handleDelete, deleteLoading)}
        expandable={
          domainId && {
            expandedRowRender: (street) => (
              <RealEstateBlock domainId={domainId} streetId={street._id} />
            ),
          }
        }
        dataSource={fetchedStreets?.data}
        scroll={{ x: 500 }}
      />
  )
}

const getDefaultColumns = (
  handleDelete?: (streetId: string) => void,
  deleteLoading?: boolean
): ColumnType<any>[] => [
  {
    title: 'Місто',
    width: '25%',
    dataIndex: 'city',
  },
  {
    title: 'Вулиця',
    dataIndex: 'address',
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    width: 50,
    render: (_, street: IStreet) => (
      <Popconfirm
        title={`Ви впевнені що хочете видалити вулицю ${street.address} (м. ${street.city})?`}
        onConfirm={() => handleDelete(street._id)}
        cancelText="Відміна"
        disabled={deleteLoading}
      >
        <DeleteOutlined />
      </Popconfirm>
    ),
  },
]

export default StreetsTable
