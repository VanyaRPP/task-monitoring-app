<<<<<<< HEAD
import React, { ReactElement } from 'react'
import React from 'react'
import { Table } from 'antd'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import s from './style.module.scss'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeleteDomainMutation,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import OrganistaionsComponents from '@common/components/UI/OrganistaionsComponents'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'
import { Alert, Popconfirm, Table, message } from 'antd'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'
import RealEstateBlock from './realEstates'

const DomainsBlock = () => {
  const { data: domains, isLoading } = useGetDomainsQuery({})
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router

  const {
    data: allDomain,
    isLoading: allDomainLoading,
    isError: allDomainError,
  } = useGetDomainsQuery({
    limit: pathname === AppRoutes.DOMAIN ? 200 : 5,
  })
  const [deleteDomain, { isLoading: deleteLoading }] = useDeleteDomainMutation()

  let content: ReactElement | null = null

  const handleDelete = async (id: string) => {
    const response = await deleteDomain(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  const domainsPageColumns =
    router.pathname === AppRoutes.DOMAIN
      ? [
          {
            title: 'Телефон',
            dataIndex: 'phone',
          },
          {
            title: 'Пошта',
            dataIndex: 'email',
          },
        ]
      : []

  const columns = [
    {
      title: 'Назва',
      dataIndex: 'name',
    },
    {
      title: 'Адреса',
      dataIndex: 'address',
    },
    {
      title: 'Адміністратори',
      dataIndex: 'adminEmails',
    },
    {
      title: 'Опис',
      dataIndex: 'description',
    },
    {
      title: 'Отримувач',
      dataIndex: 'bankInformation',
    },
    ...domainsPageColumns,
  ]


  if (allDomainError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  }

  return (
    <TableCard
      title={<DomainStreetsComponent data={domains} />}
      className={cn({ [s.noScroll]: pathname === AppRoutes.DOMAIN })}
    >
      <Table
        expandable={{
          expandedRowRender: (data) => (
            <Table
              expandable={{
                expandedRowRender: (street) => (
                  <RealEstateBlock domainId={data._id} streetId={street._id} />
                ),
              }}
              dataSource={data.streets}
              columns={columns1}
              pagination={false}
              rowKey="_id"
            />
          ),
        }}
        columns={[
          ...columns,
          {
            title: '',
            dataIndex: '',
            width: '9%',
            render: (_, domain: IExtendedDomain) => (
              <div className={s.popconfirm}>
                <Popconfirm
                  title={`Ви впевнені що хочете видалити нерухомість?`}
                  onConfirm={() => handleDelete(domain?._id)}
                  cancelText="Відміна"
                  disabled={deleteLoading}
                >
                  <DeleteOutlined className={s.icon} />
                </Popconfirm>
              </div>
            ),
          },
        ]}
        loading={allDomainLoading}
        dataSource={allDomain}
        pagination={false}
        bordered
        size="small"
        rowKey="_id"
      />
    </TableCard>
  )
}

export default DomainsBlock
