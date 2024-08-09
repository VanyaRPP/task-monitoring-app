'use client'

import { UserOutlined } from '@ant-design/icons'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Tags } from '@components/UI/Tags'
import { Roles } from '@utils/constants'
import { Avatar, Card, Divider, Flex, Form, Space, Tag, Typography } from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useMemo } from 'react'
import styles from './style.module.scss'

export const ProfilePage: React.FC = () => {
  return <V2 />
}

const V2: React.FC = () => {
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()

  const {
    data: { domainsFilter: domains, realEstatesFilter: companies } = {
      domainsFilter: [],
      realEstatesFilter: [],
    },
  } = useGetAllRealEstateQuery({})

  const isDomainAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.DOMAIN_ADMIN)
  }, [user])
  const isGlobalAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.GLOBAL_ADMIN)
  }, [user])

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
              layout="fill"
              objectFit="cover"
            />
          </Card>
          <Card className={styles.Content} size="small">
            <Card.Meta
              title={
                <Typography.Text style={{ fontSize: 32 }}>
                  {session.user.name || 'My profile'}
                </Typography.Text>
              }
              description={<Tags items={user?.roles} />}
              avatar={
                <Avatar
                  size={128}
                  icon={<UserOutlined />}
                  style={{ borderRadius: 8 }}
                  src={<Image src={session.user.image || ''} fill alt="user" />}
                />
              }
            />
          </Card>
        </div>
      )}
      <Flex gap={16}>
        <Card title="Member" style={{ width: '400px' }}>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <Typography.Text type="secondary">Domains</Typography.Text>
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
            <Typography.Text type="secondary">Companies</Typography.Text>
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
        <Card title="Profile information" style={{ flex: 1 }}>
          <Form>
            <Typography.Text editable>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </Typography.Text>
            <Divider />
            TODO: Profile edit form
          </Form>
        </Card>
      </Flex>
      {/* TODO: users table for globalAdmin */}
    </Space>
  )
}
