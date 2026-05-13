'use client'

import { useState } from 'react'

import { PlusOutlined } from '@ant-design/icons'
import FeatureFlagModal from '@common/components/Pages/Profile/Modal/AddFeatureFlagModal'

import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { FeatureFlagsTable } from '@common/components/FeatureFlagsTable'
import { Roles } from '@utils/constants'
import { Button, Card, Flex, Space, Typography } from 'antd'
import { Tabs } from 'antd'
import {UsersTable} from '@common/components/Tables/UsersTable'
import { CustomServicesTable } from '@common/components/Tables/CustomService/Table'
import { DomainTypeTemplatesTable } from '@common/components/Tables/DomainTypeTemplates'
import { useGetDomainsByAdminQuery } from '@common/api/domainApi/domain.api'

export const AdminPanelPage: React.FC = () => {
  const { data: user } = useGetCurrentUserQuery()
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = user?.roles?.includes(Roles.DOMAIN_ADMIN)

  const { data: domains = [] } = useGetDomainsByAdminQuery(undefined, {
    skip: !isDomainAdmin || isGlobalAdmin,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingFlag, setEditingFlag] = useState(null)
  if (!isGlobalAdmin && !isDomainAdmin) return null

  return (
    <Space
      direction="vertical"
      style={{ width: '100%', position: 'relative' }}
      size="middle"
    >
          <Card>
            <Tabs
              defaultActiveKey="users"
              items={[
                {
                  key: 'users',
                  label: 'Користувачі',
                  children: (
                    <>
                      <Flex
                        justify="space-between"
                        align="center"
                        style={{ marginBottom: 16 }}
                      >
                        <Typography.Title level={4} style={{ marginBottom: 16 }}>
                          Користувачі
                        </Typography.Title>
                      </Flex>
                      <UsersTable domains={domains} isDomainAdmin={isDomainAdmin}/>
                    </>
                  ),
                },
                ...(isGlobalAdmin
                  ? [
                {
                  key: 'flags',
                  label: 'Фічефлаги',
                  children: (
                    <>
                      <Flex
                        justify="space-between"
                        align="center"
                        style={{ marginBottom: 16 }}
                      >
                        <Typography.Title level={4} style={{ margin: 0 }}>
                          Фічефлаги
                        </Typography.Title>
                        <FeatureFlagModal
                          open={modalOpen}
                          onClose={() => {
                            setModalOpen(false)
                            setEditingFlag(null)
                          }}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setModalOpen(true)}
                        ></Button>
                      </Flex>

                      <FeatureFlagsTable />
                    </>
                  ),
                },
                {
                  key: 'customservices',
                  label: 'Послуги',
                  children: (
                     <CustomServicesTable />
                  ),
                },
                {
                  key: 'templates',
                  label: 'Шаблони типів',
                  children: <DomainTypeTemplatesTable />,
                },
              ]
            : []),
              ]}
            />
          </Card>
    </Space>
  )
}