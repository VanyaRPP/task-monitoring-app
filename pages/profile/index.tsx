import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Image } from 'antd'
import s from './style.module.scss'
import {
  useGetUserByEmailQuery,
  useUpdateUserMutation,
} from '../../api/userApi/user.api'
import RoleSwither from '../../components/roleSwitcher'
import withAuthRedirect from '../../components/HOC/withAuthRedirect'
import { useSession } from 'next-auth/react'

const Profile: React.FC = () => {
  const { data: session } = useSession()

  const { data, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  return (
    <div className={s.Container}>
      <div className={s.HalfBlock}>
        <Avatar
          className={s.Avatar}
          icon={<UserOutlined />}
          src={<Image src={session?.user?.image || undefined} alt="User" />}
        />
      </div>
      <div className={s.HalfBlock}>
        <h2 className={s.Header}>My profile</h2>
        <Card loading={isLoading} size="small">
          <h2>{user?.name}</h2>
        </Card>
        <Card loading={isLoading} size="small" title="Role">
          <RoleSwither />
        </Card>
        <Card loading={isLoading} size="small" title="Email">
          <p>{user?.email}</p>
        </Card>
        <Card title="General information" loading={isLoading} size="small">
          <p>City: Zhytomyr</p>
        </Card>
        <Card
          style={{ display: 'flex', justifyContent: 'center' }}
          size="small"
          loading={isLoading}
        >
          <Button ghost type="primary">
            <EditOutlined key="edit" />
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default withAuthRedirect(Profile)
