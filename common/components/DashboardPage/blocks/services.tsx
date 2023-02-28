import React, { FC, ReactElement } from 'react'
import { Alert, Button, message, Popconfirm, Spin, Table } from 'antd'
import ServiceCardHeader from '@common/components/UI/ServiceCardHeader'
import ServiceCard from '@common/components/UI/ServiceCard'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import {
  IExtendedPayment,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import {
  useGetAllUsersQuery,
  useGetUserByEmailQuery,
} from '@common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import { Roles } from '@utils/constants'
import s from './style.module.scss'
import { Tooltip } from 'antd'
import type { DatePickerProps } from 'antd'

// const onChange: DatePickerProps['onChange'] = (date, dateString) => {
//   console.log(date, dateString)
// }

const ServiceBlock: FC = () => {
  const { data } = useSession()
  const { data: userResponse } = useGetUserByEmailQuery(data?.user?.email)

  const {
    data: payments,
    isLoading,
    isFetching,
    isError,
  } = useGetAllPaymentsQuery('')
  const [deletePayment] = useDeletePaymentMutation()
  const { data: usersData } = useGetAllUsersQuery('')

  const userRole = userResponse?.data?.role

  const handleDeletePayment = async (id: string) => {
    const response = await deletePayment(id)
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
      render: (date) => dateToDefaultFormat(date),
    },
    {
      title: 'Утримання',
      dataIndex: 'debit',
      key: 'debit',
      width: '20%',
      render: (debit) => (debit === 0 ? null : debit),
    },
    {
      title: 'Електрика',
      dataIndex: 'credit',
      key: 'credit',
      width: '20%',
      render: (credit) => (credit === 0 ? null : credit),
    },
    {
      title: 'Вода',
      dataIndex: 'description',
      key: 'description',
      width: '15%',
      ellipsis: true,
    },
    {
      title: 'Інд Інф',
      dataIndex: 'description',
      key: 'description',
      width: '15%',
      ellipsis: true,
    },
    userRole === Roles.ADMIN
      ? {
          title: '',
          dataIndex: '',
          width: '15%',
          render: (_, payment: IExtendedPayment) => (
            <div className={s.Popconfirm}>
              <Popconfirm
                title={`Ви впевнені що хочете видалити оплату від ${dateToDefaultFormat(
                  payment.date as unknown as string
                )}?`}
                onConfirm={() => handleDeletePayment(payment._id)}
                cancelText="Відміна"
              >
                <DeleteOutlined className={s.Icon} />
              </Popconfirm>
            </div>
          ),
        }
      : { width: '0' },
  ]

  let content: ReactElement

  if (isLoading || isFetching || !payments) {
    content = <Spin className={s.Spin} />
  } else if (isError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        className={s.Table}
        columns={columns}
        dataSource={
          userRole === Roles.ADMIN ? payments : userResponse?.data?.payments
        }
        pagination={{
          responsive: false,
          size: 'small',
          pageSize: 5,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }}
        bordered
      />
    )
  }

  return <ServiceCard title={<ServiceCardHeader />}>{content}</ServiceCard>
}

export default ServiceBlock
