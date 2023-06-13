import React from 'react'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import s from './style.module.scss'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeleteDomainMutation,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'
import { Popconfirm, Table, message } from 'antd'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import StreetsBlock from './streets'

const DomainsBlock = ({}) => {
  const { data: domains, isLoading } = useGetDomainsQuery({})
  const router = useRouter()

  const [deleteDomain, { isLoading: deleteLoading }] = useDeleteDomainMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteDomain(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }
  return (
    <TableCard
      title={<DomainStreetsComponent data={domains} />}
      className={cn({ [s.noScroll]: router.pathname === AppRoutes.DOMAIN })}
    >
      <Table
        expandable={{
          expandedRowRender: (data) => (
            <div className={cn(s.StreetsBlockContainer)}>
              <StreetsBlock
                domainId={data._id}
                showAddButton={false}
                height={500}
            </div>
          ),
        }}
        columns={[
          ...columns,
          ...(router.pathname === AppRoutes.DOMAIN ? domainsPageColumns : []),
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
        loading={isLoading}
        dataSource={domains}
        pagination={false}
        bordered
        size="small"
        rowKey="_id"
      />
    </TableCard>
  )
}

const domainsPageColumns = [
  {
    title: 'Телефон',
    dataIndex: 'phone',
  },
  {
    title: 'Пошта',
    dataIndex: 'email',
  },
]

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
]
export default DomainsBlock
