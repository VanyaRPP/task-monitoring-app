import RealEstateCardHeader from '@common/components/UI/RealEstateComponents/RealEstateCardHeader'
import {
  useDeleteRealEstateMutation,
  useGetAllRealEstateQuery,
} from '@common/api/realestateApi/realestate.api'
import TableCard from '@common/components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import React, { FC, ReactElement, useContext } from 'react'
import { useRouter } from 'next/router'
import { Alert, Popconfirm, Table, message } from 'antd'
import cn from 'classnames'
import s from './style.module.scss'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { createContext } from 'react'

export const CompanyPageContext = createContext(
  {} as { domainId?: string; streetId?: string }
)
export const useCompanyPageContext = () => useContext(CompanyPageContext)

interface IRealEstate {
  domainId?: string
  streetId?: string
}

interface IRealEstateColumns {
  title: string
  dataIndex: string
  render?: (i: any) => any
}

const RealEstateBlock: FC<IRealEstate> = ({ domainId, streetId }) => {
  const router = useRouter()
  const { pathname } = router

  const {
    data: allRealEstate,
    isLoading: allRealEstateLoading,
    isError: allRealEstateError,
  } = useGetAllRealEstateQuery({
    limit: pathname === AppRoutes.REAL_ESTATE ? 200 : 5,
    domainId,
    streetId,
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

  const columns: IRealEstateColumns[] = [
    {
      title: 'Назва компанії',
      dataIndex: 'companyName',
    },
    {
      title: 'Банківська інформація',
      dataIndex: 'bankInformation',
    },
    {
      title: 'Договір',
      dataIndex: 'agreement',
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
  ]

  if (!domainId && !streetId && !allRealEstateLoading) {
    columns.unshift(
      {
        title: 'Домен',
        dataIndex: 'domain',
        render: (i) => i?.name,
      },
      {
        title: 'Адреса',
        dataIndex: 'street',
        render: (i) => i?.address,
      }
    )
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
                  title={`Ви впевнені що хочете видалити нерухомість?`}
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
      title={
        <CompanyPageContext.Provider value={{ domainId, streetId }}>
          <RealEstateCardHeader />
        </CompanyPageContext.Provider>
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.REAL_ESTATE })}
    >
      {content}
    </TableCard>
  )
}

export default RealEstateBlock
