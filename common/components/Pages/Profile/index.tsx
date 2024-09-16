'use client'

import { UserOutlined } from '@ant-design/icons'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { UsersTable } from '@components/Tables/UsersTable'
import { Tags } from '@components/UI/Tags'
import {
  Form,
  Avatar,
  Button,
  Card,
  Divider,
  Flex,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import styles from './style.module.scss'
import { EditUserForm } from '../../Forms/EditUserForm'
import { AppRoutes, Roles } from '@utils/constants'
import { useRouter } from 'next/router'

export const ProfilePage: React.FC = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)

  const {
    data: { domainsFilter: domains, realEstatesFilter: companies } = {
      domainsFilter: [],
      realEstatesFilter: [],
    },
  } = useGetAllRealEstateQuery({})


  const handleTagClick = ({text, value}) => {
    router.push({
      pathname: AppRoutes.SEP_DOMAIN,
      query: {
        domain: value,
      },
    })
  }

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
                  {user?.name || 'My profile'}
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
        <Card title="Представник" style={{ width: '400px' }}>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <Typography.Text type="secondary">Надавачі послуг</Typography.Text>
          </Divider>
          <Tags
            wrap
            align="center"
            items={domains.map((domain) => domain)}
            render={(domain, index) => (
              <Tag
                key={index}
                bordered={false}
                color="purple"
                className={styles.tag}
                onClick={() => {handleTagClick(domain)}}
              >
                {domain.text}
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
        <Card title="Інформація користувача" style={{ flex: 1 }}>
          <EditUserForm userId={user?._id?.toString()} form={form} />
          <Button onClick={form.submit}>Зберегти</Button>
        </Card>
      </Flex>

      {isGlobalAdmin && (
        <Card title="Користувачі">
          <UsersTable />
        </Card>
      )}
    </Space>
  )
}
