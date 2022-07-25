import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Image } from 'antd'
import RoleSwitcher from 'common/components/UI/roleSwitcher'
import { useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import FeedbacksCard from 'common/components/FeedbacksCard'
import s from './style.module.scss'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../api/userApi/user.api'
import { AppRoutes, Roles } from '../../../utils/constants'

const ProfilePage: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()

  const { data } = useGetUserByIdQuery(`${router.query.id}`)

  const { data: userData, isLoading } = useGetUserByEmailQuery(
    `${router.query.id ? data?.data?.email : session?.user?.email}`
  )
  const user = userData?.data

  return (
    <>
      <h2 className={s.Header}>My profile</h2>

      <div className={s.Container}>
        <Card
          loading={isLoading}
          title={user?.name}
          className={s.Profile}
          extra={
            user?.role === Roles.ADMIN && (
              <Button type="link" onClick={() => Router.push(AppRoutes.ADMIN)}>
                Admin Panel
              </Button>
            )
          }
        >
          <div className={s.Avatar}>
            <Avatar
              icon={<UserOutlined />}
              src={<Image src={user?.image || undefined} alt="User" />}
            />
          </div>

          <div className={s.Info}>
            <Card size="small" title="Role">
              {router.query.id ? user?.role : <RoleSwitcher />}
            </Card>

            <Card size="small" title="Email">
              <p>{user?.email}</p>
            </Card>

            {user?.tel && (
              <Card size="small" title="Phone">
                <p>{user?.tel}</p>
              </Card>
            )}

            <Card title="Address" size="small">
              <p>{user?.address?.name || 'Zhytomyr'}</p>
            </Card>
            <Button type="primary">
              <EditOutlined key="edit" />
            </Button>
          </div>
        </Card>

        <FeedbacksCard user={user} loading={isLoading} />
      </div>
    </>
  )
}

export default ProfilePage
