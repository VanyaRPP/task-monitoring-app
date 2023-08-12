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
import { Popconfirm, Table, message, Tooltip } from 'antd'
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
              />
            </div>
          ),
        }}
        columns={[
          {
            title: 'Назва',
            dataIndex: 'name',
          },
          {
            title: 'Адміністратори',
            dataIndex: 'adminEmails',
            render: (adminEmails) => <span>{adminEmails.join(', ')}</span>,
          },
          {
            title: 'Опис',
            dataIndex: 'description',
            render: (text) => (
              <Tooltip title={text}>
                <QuestionCircleOutlined />
              </Tooltip>
            ),
          },
          {
            title: '',
            dataIndex: '',
            width: '9%',
            render: (_, domain: IExtendedDomain) => (
              <div className={s.popconfirm}>
                <Popconfirm
                  title={`Ви впевнені що хочете видалити ${
                    domain.name ?? 'цей домен'
                  }?`}
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

export default DomainsBlock
