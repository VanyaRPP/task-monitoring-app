import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Image } from 'antd'
import s from './style.module.scss'
import { useGetUserByEmailQuery } from '../../common/api/userApi/user.api'
import RoleSwither from '../../common/components/roleSwitcher'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { useSession } from 'next-auth/react'

const Profile: React.FC = () => {
  const { data: session } = useSession()

  const { data, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  return (
    <>
      <h2 className={s.Header}>My profile</h2>

      <Card loading={isLoading} title={user?.name} className={s.Container}>
        <div className={s.Avatar}>
          <Avatar
            icon={<UserOutlined />}
            src={<Image src={session?.user?.image || undefined} alt="User" />}
          />
        </div>

        <div className={s.Info}>
          <Card size="small" title="Role">
            <RoleSwither />
          </Card>

          <Card size="small" title="Email">
            <p>{user?.email}</p>
          </Card>

          <Card title="General information" size="small">
            <p>City: Zhytomyr</p>
          </Card>

          <Button type="primary">
            <EditOutlined key="edit" />
          </Button>
        </div>
      </Card>
    </>
  )
}

export default withAuthRedirect(Profile)
