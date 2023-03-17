import React, { FC, ReactElement } from 'react'
import { Alert, message, Popconfirm, Spin, Table } from 'antd'
import ServiceCardHeader from '@common/components/UI/ServiceCardHeader'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeleteServiceMutation,
  useGetAllServicesQuery,
} from '@common/api/serviceApi/service.api'
import { dateToPick } from '@common/assets/features/formatDate'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { Tooltip } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SelectOutlined } from '@ant-design/icons'
import cn from 'classnames'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'

const ServicesBlock = () => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router
  const { data } = useSession()

  const {
    data: byEmailUser,
    isLoading: byEmailUserLoading,
    isFetching: byEmailUserFetching,
    isError: byEmailUserError,
  } = useGetUserByEmailQuery(email, { skip: !email })
  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetUserByEmailQuery(data?.user.email, { skip: !data?.user.email })

  const isAdmin = currUser?.data?.role === Roles.ADMIN

  const {
    data: services,
    isLoading: servicesLoading,
    isFetching: servicesFetching,
    isError: servicesError,
  } = useGetAllServicesQuery({
    limit: pathname === AppRoutes.SERVICE ? 200 : 5,
    ...(email || isAdmin
      ? { userId: byEmailUser?.data._id as string }
      : { userId: currUser?.data._id as string }),
  })

  const [deleteService, { isLoading: deleteLoading, isError: deleteError }] =
    useDeleteServiceMutation()

  const handleDeleteService = async (id: string) => {
    const response = await deleteService(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні рахунку')
    }
  }

  const columns = [
    {
      title: 'Місяць',
      dataIndex: 'date',
      key: 'date',
      width: '15%',
      render: (date) => dateToPick(date),
    },
    {
      title: 'Утримання',
      dataIndex: 'orenda',
      key: 'orenda',
      width: '20%',
    },
    {
      title: 'Електрика',
      dataIndex: 'electricPrice',
      key: 'electricPrice',
      width: '20%',
    },
    {
      title: 'Вода',
      dataIndex: 'waterPrice',
      key: 'waterPrice',
      width: '15%',
    },
    {
      title: 'Інд Інф',
      dataIndex: 'inflaPrice',
      key: 'inflaPrice',
      width: '15%',
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      key: 'description',
      width: '15%',
      ellipsis: true,
    },
    isAdmin
      ? {
          title: '',
          dataIndex: '',
          width: '15%',
          render: (_, service: IExtendedService) => (
            <div className={s.popconfirm}>
              <Popconfirm
                title={`Ви впевнені що хочете видалити оплату від ${dateToPick(
                  service?.date as unknown as string
                )}?`}
                onConfirm={() => handleDeleteService(service?._id)}
                cancelText="Відміна"
                disabled={deleteLoading}
              >
                <DeleteOutlined className={s.icon} />
              </Popconfirm>
            </div>
          ),
        }
      : { width: '0' },
  ]

  let content: ReactElement

  if (byEmailUserError || deleteError || servicesError || currUserError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={services}
        pagination={false}
        bordered
        loading={
          byEmailUserLoading ||
          byEmailUserFetching ||
          currUserLoading ||
          currUserFetching ||
          servicesLoading ||
          servicesFetching
        }
        rowKey="_id"
      />
    )
  }

  return (
    <TableCard
      title={
        email ? (
          <span className={s.title}>{`Оплата від користувача ${email}`}</span>
        ) : isAdmin ? (
          <ServiceCardHeader />
        ) : (
          <Link href={AppRoutes.SERVICE}>
            <a className={s.title}>
              Послуги <SelectOutlined />
            </a>
          </Link>
        )
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.SERVICE })}
    >
      {content}
    </TableCard>
  )
}
export default ServicesBlock
