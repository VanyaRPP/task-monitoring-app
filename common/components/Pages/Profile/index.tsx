'use client'

import { UserOutlined } from '@ant-design/icons'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Tags } from '@components/UI/Tags'
import { Avatar, Card, Divider, Flex, Space, Spin, Tag, Typography } from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import styles from './style.module.scss'

export const ProfilePage: React.FC = () => {
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()

  const {
    data: { domainsFilter: domains, realEstatesFilter: companies } = {
      domainsFilter: [],
      realEstatesFilter: [],
    },
  } = useGetAllRealEstateQuery({})

  return (
    <Space
      direction="vertical"
      style={{ width: '100%', position: 'relative' }}
      size="middle"
    >
      {!!session?.user && (
        <div className={styles.User}>
          <Card className={styles.Background}>
            <Image
              className={styles.Image}
              src={session.user.image || ''}
              alt="background"
              priority
              sizes="256px 256px"
              fill
            />
          </Card>
          <Card className={styles.Content} size="small">
            <Card.Meta
              title={
                <Typography.Title level={1} style={{ margin: 0 }}>
                  {session.user.name || 'My profile'}
                </Typography.Title>
              }
              description={<Tags items={user?.roles} />}
              avatar={
                !!session.user.image && (
                  <Avatar
                    size={128}
                    icon={<UserOutlined />}
                    style={{ borderRadius: 8 }}
                    src={
                      <Image
                        src={session.user.image}
                        width={128}
                        height={128}
                        alt="user"
                      />
                    }
                  />
                )
              }
            />
          </Card>
        </div>
      )}
      <Flex gap={16}>
        <Card title="Взаємодії" style={{ width: '400px' }}>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <Typography.Text type="secondary">Надавачі послуг</Typography.Text>
          </Divider>
          <Tags
            wrap
            align="center"
            items={domains.map(({ text }) => text as string)}
            render={(domain, index) => (
              <Tag
                key={index}
                bordered={false}
                color="purple"
                style={{ margin: 0 }}
              >
                {domain}
              </Tag>
            )}
          />
          <Divider orientation="left">
            <Typography.Text type="secondary">Компанії</Typography.Text>
          </Divider>
          <Tags
            wrap
            align="center"
            items={companies.map(({ text }) => text as string)}
            render={(domain, index) => (
              <Tag
                key={index}
                bordered={false}
                color="blue"
                style={{ margin: 0 }}
              >
                {domain}
              </Tag>
            )}
          />
        </Card>
        {/* TODO: Profile edit form */}
        <Card title="Інформація користувача" style={{ flex: 1 }}>
          <Spin>Можливість редагування профілю вже в процесі розробки ^_^</Spin>
          {/* <Form>
            <Typography.Text editable>description</Typography.Text>
            <Divider />
          </Form> */}
        </Card>
      </Flex>

      {/* TODO: users table for globalAdmin */}
    </Space>
  )
}
