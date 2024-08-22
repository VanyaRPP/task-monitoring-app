'use client'

import { UserOutlined } from '@ant-design/icons'
import { Profile } from '@components/UI/Profile'
import { Avatar as AntdAvatar, Popover } from 'antd'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export interface AvatarProps {
  size?: number
  onOpen?: () => void
  onClose?: () => void
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 40,
  onOpen,
  onClose,
}) => {
  const { data: session } = useSession()

  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }, [open, onOpen, onClose])

  return (
    <Popover
      trigger="click"
      onOpenChange={setOpen}
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
