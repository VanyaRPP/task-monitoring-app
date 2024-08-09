import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Tags } from '@components/UI/Tags'
import { Roles } from '@utils/constants'
import {
  Avatar,
  Button,
  Divider,
  Flex,
  Space,
  Tag,
  theme,
  Typography,
} from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useMemo } from 'react'
import styles from './style.module.scss'

export const Profile: React.FC = () => {
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

  const { token } = theme.useToken()

  return (
    <div className={styles.Profile}>
      <div
        className={styles.Background}
        style={{ backgroundColor: token.colorPrimaryBg }}
      />
      <Space direction="vertical" size="large" style={{ width: 320 }}>
        <Flex justify="center" style={{ marginTop: 28 }}>
          <Avatar
            size={88}
            icon={<UserOutlined />}
            src={
              session?.user?.image ? (
                <Image
                  src={session.user.image}
                  width={80}
                  height={80}
                  alt="user"
                />
              ) : null
            }
          />
        </Flex>

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Flex justify="center" align="center" gap={8} wrap>
            <Typography.Text strong style={{ fontSize: '1.25rem' }}>
              {session?.user?.name}
            </Typography.Text>

            {!!user?.roles && (
              <Tags wrap align="center" justify="center" items={user?.roles} />
            )}
          </Flex>

          <Divider style={{ margin: 0 }} />

          <Flex justify="center">
            <Typography.Text type="secondary">
              {session?.user?.email}
            </Typography.Text>
          </Flex>

          {isDomainAdmin && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tags
                title={
                  <Typography.Text strong style={{ fontSize: '0.9rem' }}>
                    Domains:
                  </Typography.Text>
                }
                wrap
                align="center"
                items={domains.map(({ text }) => text as string)}
                render={(domain, index) => (
                  <Tag
                    key={index}
                    bordered={false}
                    color="red"
                    style={{ margin: 0 }}
                  >
                    {domain}
                  </Tag>
                )}
              />
            </Space>
          )}
          {!isGlobalAdmin && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tags
                title={
                  <Typography.Text strong style={{ fontSize: '0.9rem' }}>
                    Companies:
                  </Typography.Text>
                }
                wrap
                align="center"
                items={companies.map(({ text }) => text as string)}
              />
            </Space>
          )}
        </Space>

        <Space direction="vertical" style={{ width: '100%' }}>
          {!!session?.user && (
            <Button block icon={<UserOutlined />}>
              Profile
            </Button>
          )}
          <Button
            type="primary"
            block
            icon={session?.user ? <LogoutOutlined /> : <LoginOutlined />}
          >
            {session?.user ? 'Log out' : 'Log in'}
          </Button>
        </Space>
      </Space>
    </div>
  )
}