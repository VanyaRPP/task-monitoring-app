import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { isEmpty } from '@utils/helpers'
import {
  Avatar as AntdAvatar,
  Button,
  Divider,
  Flex,
  Popover,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

export interface AvatarProps {
  size?: number
  open?: boolean
  onOpen?: () => void
  onClose?: () => void
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 40,
  open: _open,
  onOpen,
  onClose,
}) => {
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()

  const [open, setOpen] = useState<boolean>(false)

  const handleClick = useCallback(() => {
    if (isEmpty(_open)) {
      setOpen(!open)
    }
  }, [open, _open, setOpen])

  useEffect(() => {
    if (open) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }, [open, onOpen, onClose])

  useEffect(() => {
    if (!isEmpty(_open)) {
      setOpen(_open)
    }
  }, [_open, setOpen])

  return (
    <Popover
      open={open}
      placement="bottomRight"
      content={
        <>
          <div
            style={{
              position: 'absolute',
              left: '4px',
              top: '4px',
              width: 'calc(100% - 8px)',
              height: '80px',
              background: '#000000cc',
              content: '',
              borderRadius: 6,
            }}
          />
          <Space direction="vertical" size="large" style={{ width: 300 }}>
            <Flex justify="center" style={{ marginTop: 28 }}>
              <AntdAvatar
                size={88}
                icon={<UserOutlined />}
                style={{ border: '4px solid white' }}
                src={
                  <Image
                    src={session?.user?.image}
                    width={80}
                    height={80}
                    alt="user"
                  />
                }
              />
            </Flex>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Flex justify="center">
                <Typography.Text strong style={{ fontSize: '1.25rem' }}>
                  {session?.user?.name}
                </Typography.Text>
              </Flex>

              <Divider style={{ margin: 0 }} />

              <Flex justify="center">
                <Typography.Text type="secondary">
                  {session?.user?.email}
                </Typography.Text>
              </Flex>

              {!!user?.roles && (
                <Flex justify="center">
                  {user.roles.map((role) => (
                    <Tag key={role} bordered={false} color="blue">
                      {role}
                    </Tag>
                  ))}
                </Flex>
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
        </>
      }
    >
      <AntdAvatar
        size={size}
        icon={<UserOutlined />}
        onClick={handleClick}
        src={
          <Image
            src={session?.user?.image}
            width={size}
            height={size}
            alt="user"
          />
        }
      />
    </Popover>
  )
}
