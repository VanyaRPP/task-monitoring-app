import React from 'react'
import {
  useDeleteStreetMutation,
  useGetAllStreetsQuery,
} from '@common/api/streetApi/street.api'
import TableCard from '@common/components/UI/TableCard'
import { IStreet } from '@common/modules/models/Street'
import { Table, Popconfirm, message } from 'antd'
import cn from 'classnames'
import { DeleteOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import s from './style.module.scss'
import { AppRoutes } from '@utils/constants'
import StreetsCardHeader from '@common/components/UI/StreetsCardHeader'
import RealEstateBlock from './realEstates'

const StreetsBlock = ({
  domainId,
  showAddButton,
  height,
}: {
  domainId?: string
  showAddButton?: boolean
  height?: number
}) => {
  const { data: streets, isLoading } = useGetAllStreetsQuery({ domainId })
  const router = useRouter()
  const [deleteStreet, { isLoading: deleteLoading }] = useDeleteStreetMutation()

  const handleDeleteStreet = async (id: string) => {
    const response = await deleteStreet(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні рахунку')
    }
  }

  const columns = [
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
      title: '',
      width: '10%',
      render: (_, street: IStreet) => (
        <div className={s.popconfirm}>
          <Popconfirm
            title={`Ви впевнені що хочете видалити вулицю ${street.address} (м. ${street.city})?`}
            onConfirm={() => handleDeleteStreet(street._id)}
            cancelText="Відміна"
            disabled={deleteLoading}
          >
            <DeleteOutlined className={s.icon} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <TableCard
      title={<StreetsCardHeader showAddButton={showAddButton} />}
      className={cn({ [s.noScroll]: router.pathname === AppRoutes.STREETS })}
      style={{ height: height ? `${height}px` : '300px' }}
    >
      <Table
        loading={isLoading}
        expandable={
          domainId && {
            expandedRowRender: (street) => (
              <RealEstateBlock domainId={domainId} streetId={street._id} />
            ),
          }
        }
        dataSource={streets}
        rowKey="_id"
        columns={columns}
        size="small"
        bordered
        pagination={{
          responsive: false,
          size: 'small',
          pageSize: 5,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }}
      />
    </TableCard>
  )
}

export default StreetsBlock
