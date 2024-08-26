'use client'

import { UserOutlined } from '@ant-design/icons'
import { Profile } from '@components/UI/Profile'
import { Avatar as AntdAvatar, Popover } from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useCallback } from 'react'

export interface AvatarProps {
  size?: number
  onOpen?: () => void
  onClose?: () => void
  onChange?: (open: boolean) => void
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 40,
  onOpen,
  onClose,
  onChange,
}) => {
  const { data: session } = useSession()

  const handleChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        onOpen?.()
      } else {
        onClose?.()
      }
      onChange?.(newOpen)
    },
    [onClose, onOpen, onChange]
  )

  return (
    <Popover
      trigger="click"
      onOpenChange={handleChange}
      placement="bottomRight"
      content={<Profile />}
    >
      <AntdAvatar
        size={size}
        icon={<UserOutlined />}
        src={
          session?.user?.image ? (
            <Image
              src={session.user.image}
              width={size}
              height={size}
              alt="user"
            />
          ) : null
        }
      />
    </Popover>
  )
}
