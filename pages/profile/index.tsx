import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Image } from 'antd'
import { useSession } from 'next-auth/react'
import { FC } from 'react'
import { useRouter } from 'next/router'
import Loading from '../../components/Loading'
import s from './style.module.sass'

const Profile: FC = () => {

  const router = useRouter()

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/api/auth/signin')
    }
  })

  if (status === 'loading') {
    return <Loading />
  }

  return (
    <div className={s.Container}>
      <div className={s.HalfBlock}>
        <Avatar
          size={300}
          icon={<UserOutlined />}
          src={<Image src={session?.user?.image} alt="User" />}
        />
      </div>
      <div className={s.HalfBlock}>
        <h2>My profile</h2>
        <Card
          size="small">
          <h2>{session?.user?.name}</h2>
          <h3>USER/ADMIN</h3>
        </Card>
        <Card
          size="small"
          title="Email"
        >
          <p>{session?.user?.email}</p>
        </Card>
        <Card
          title="General information"
          actions={[
            <EditOutlined key="edit" />,
          ]}
        >
          <Card size="small">
            <p>City: Zhytomyr</p>
          </Card>
          <Card size="small">
            <p>Date of birdth: {Date()}</p>
          </Card>

        </Card>

      </div>

    </div>
  )
}

export default Profile

