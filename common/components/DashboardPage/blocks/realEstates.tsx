import RealEstateCardHeader from '@common/components/UI/RealEstateComponents/RealEstateCardHeader'
import {
  useDeleteRealEstateMutation,
  useGetAllRealEstateQuery,
} from '@common/api/realestateApi/realestate.api'
import TableCard from '@common/components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import React, { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Alert, Popconfirm, Table, message } from 'antd'
import cn from 'classnames'
import s from './style.module.scss'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { DeleteOutlined } from '@ant-design/icons'

const RealEstateBlock = () => {
  const router = useRouter()
  const { pathname } = router

  const {
    data: allRealEstate,
    isLoading: allRealEstateLoading,
    isError: allRealEstateError,
  } = useGetAllRealEstateQuery({
    limit: pathname === AppRoutes.REAL_ESTATE ? 200 : 5,
  })
  const [deleteRealEstate, { isLoading: deleteLoading }] =
    useDeleteRealEstateMutation()

  let content: ReactElement

  const handleDelete = async (id: string) => {
    const response = await deleteRealEstate(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  if (allRealEstateError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={[
          ...columns,
          {
            title: '',
            dataIndex: '',
            width: '5%',
            render: (_, realEstate: IExtendedRealestate) => (
              <div className={s.popconfirm}>
                <Popconfirm
                  title={`Ви впевнені що хочете видалити нерухомість ${realEstate.address} ${realEstate.description}?`}
                  onConfirm={() => handleDelete(realEstate?._id)}
                  cancelText="Відміна"
                  disabled={deleteLoading}
                >
                  <DeleteOutlined className={s.icon} />
                </Popconfirm>
              </div>
            ),
          },
        ]}
        dataSource={allRealEstate}
        pagination={false}
        bordered
        size="small"
        loading={allRealEstateLoading}
        rowKey="_id"
      />
    )
  }

  return (
    <TableCard
      title={<RealEstateCardHeader />}
      className={cn({ [s.noScroll]: pathname === AppRoutes.REAL_ESTATE })}
    >
      {content}
    </TableCard>
  )
}

const columns = [
  {
    title: 'Адреса',
    dataIndex: 'address',
  },
  {
    title: 'Назва компанії',
    dataIndex: 'description',
  },
  {
    title: 'Адміністратори',
    dataIndex: 'adminEmails',
  },
  {
    title: 'Кількість метрів',
    dataIndex: 'totalArea',
  },
  {
    title: 'Ціна за метр',
    dataIndex: 'pricePerMeter',
  },
  {
    title: 'Індивідуальне утримання за метр',
    dataIndex: 'servicePricePerMeter',
  },
  {
    title: 'Вивіз сміття',
    dataIndex: 'garbageCollector',
  },
  {
    title: 'Платник',
    dataIndex: 'payer',
  },
]

export default RealEstateBlock
