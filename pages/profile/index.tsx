import { UserOutlined } from '@ant-design/icons'
import { Avatar, Image } from 'antd'
import { useSession } from 'next-auth/react'
import { FC } from 'react'
import { useRouter } from 'next/router'
import Loading from '../../components/Loading'

const Profile: FC = () => {

  const router = useRouter()
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/api/auth/signin')
    }
  })

  if (status === 'loading') {
    return <Loading />
  }
  
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
