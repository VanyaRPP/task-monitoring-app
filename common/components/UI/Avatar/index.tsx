import { UserOutlined } from '@ant-design/icons'
import { Profile } from '@components/UI/Profile'
import { isEmpty } from '@utils/helpers'
import { Avatar as AntdAvatar, Popover } from 'antd'
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
    <Popover open={open} placement="bottomRight" content={<Profile />}>
      <AntdAvatar
        size={size}
        icon={<UserOutlined />}
        onClick={handleClick}
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
