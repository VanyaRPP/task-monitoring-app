import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Image } from 'antd'
import s from './style.module.scss'
import { useGetUserByEmailQuery } from '../../common/api/userApi/user.api'
import RoleSwither from 'common/components/UI/roleSwitcher'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { useSession } from 'next-auth/react'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { AppRoutes } from '../../utils/constants'
import { GetServerSideProps } from 'next'

const Profile: React.FC = () => {
  const { data: session } = useSession()

  const { data, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  // console.log(user)

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
          <Card size="small" title="Phone">
            <p>{user?.tel}</p>
          </Card>

          <Card title="Address" size="small">
            <p>{user?.address?.name || "Zhytomyr"}</p>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      redirect: {
        destination: AppRoutes.AUTH_SIGN_IN,
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
