import { UserOutlined } from '@ant-design/icons'
import { Avatar, Image } from 'antd'
import { FC } from 'react'

const Profile: FC = () => {
  return (
    <div>
      <h2>My profile</h2>
      <Avatar
        size={200}
        icon={<UserOutlined />}
        src={<Image src="https://joeschmoe.io/api/v1/random" alt="User" />}
      />
    </div>
  )
}

export default Profile