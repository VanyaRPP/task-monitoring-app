'use client'

import { UserOutlined } from '@ant-design/icons'
import { useGetDomainFiltersQuery } from '@common/api/filterApi/filter.api'
import { useGetMyCompaniesQuery } from '@common/api/realestateApi/realestate.api'
import { useState } from 'react'

import { PlusOutlined } from '@ant-design/icons'
import FeatureFlagModal from '@common/components/Pages/Profile/Modal/AddFeatureFlagModal'

import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { FeatureFlagsTable } from '@common/components/FeatureFlagsTable'
import { UsersTable } from '@components/Tables/UsersTable'
import { Tags } from '@components/UI/Tags'
import { AppRoutes, Roles } from '@utils/constants'
import {
  Avatar,
  Button,
  Card,
  Divider,
  Flex,
  Form,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { EditUserForm } from '../../Forms/EditUserForm'
import styles from './style.module.scss'

export const ProfilePage: React.FC = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)

  const { data: domains } = useGetDomainFiltersQuery({})
  const { data: myCompanies } = useGetMyCompaniesQuery()

  const handleTagClick = ({ text, value }) => {
    router.push({
      pathname: AppRoutes.SEP_DOMAIN,
      query: {
        name: text,
        domain: value,
      },
    })
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [editingFlag, setEditingFlag] = useState(null)

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
      <Flex className={styles.columns} gap={16}>
        <Card title="Представник" className={styles.CardRepresentative}>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <Typography.Text type="secondary">Надавачі послуг</Typography.Text>
          </Divider>
          <Tags
            wrap
            align="center"
            items={domains?.domainsFilter.map((domain) => domain)}
            render={(domain, index) => (
              <Tag
                key={index}
                bordered={false}
                color="purple"
                className={styles.tag}
                onClick={() => {
                  handleTagClick(domain)
                }}
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
            items={myCompanies?.data?.map(({ companyName }) => companyName)}
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
        <Card
          title="Інформація користувача"
          className={styles.CardUserInformation}
        >
          <EditUserForm userId={user?._id?.toString()} form={form} />
          <Button className={styles.ButtonSave} onClick={form.submit}>
            Зберегти
          </Button>
        </Card>
      </Flex>
    </Space>
  )
}
