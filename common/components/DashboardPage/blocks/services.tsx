import React, { ReactElement } from 'react'
import { Alert, message, Popconfirm, Table } from 'antd'
import ServiceCardHeader from '@common/components/UI/ServiceCardHeader'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeleteServiceMutation,
  useGetAllServicesQuery,
} from '@common/api/serviceApi/service.api'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { Tooltip } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SelectOutlined } from '@ant-design/icons'
import cn from 'classnames'
import moment from 'moment'
import s from './style.module.scss'
import { firstTextToUpperCase } from '@utils/helpers'
import { renderCurrency } from './payments'

const ServicesBlock = () => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router

  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetCurrentUserQuery()

  const isGlobalAdmin = currUser?.roles.includes(Roles.GLOBAL_ADMIN)

  const {
    data: services,
    isLoading: servicesLoading,
    isFetching: servicesFetching,
    isError: servicesError,
  } = useGetAllServicesQuery({
    limit: pathname === AppRoutes.SERVICE ? 200 : 5,
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
      title: 'Домен',
      dataIndex: 'domain',
      render: (i) => i?.name,
    },
    {
      title: 'Адреса',
      dataIndex: 'street',
      render: (i) => i?.address,
    },
    {
      title: 'Місяць',
      dataIndex: 'date',
      width: '12%',
      render: getFormattedDate,
    },
    {
      title: 'Утримання',
      dataIndex: 'rentPrice',
      render: renderCurrency,
    },
    {
      title: 'Електрика',
      dataIndex: 'electricityPrice',
      render: renderCurrency,
    },
    {
      title: 'Вода',
      dataIndex: 'waterPrice',
      render: renderCurrency,
    },
    {
      title: (
        <Tooltip title="Індекс Інфляції">
          <span>Індекс</span>
        </Tooltip>
      ),
      dataIndex: 'inflicionPrice',
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    isGlobalAdmin
      ? {
          title: '',
          render: (_, service: IExtendedService) => (
            <div className={s.popconfirm}>
              <Popconfirm
                title={`Ви впевнені що хочете видалити послугу за місяць ${moment(
                  service.date
                ).format('MMMM')}?`}
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

  if (deleteError || servicesError || currUserError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={services}
        pagination={false}
        size="small"
        bordered
        loading={
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
        ) : isGlobalAdmin ? (
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

// TODO: to helper
export function getFormattedDate(data) {
  return firstTextToUpperCase(moment(data).format('MMMM'))
}

export default ServicesBlock
