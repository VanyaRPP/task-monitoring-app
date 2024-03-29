import { Tabs } from 'antd'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import AdminPageCategories from 'common/components/AdminIU/AdminPageCategories'
import AdminPageClients from 'common/components/AdminIU/AdminPageClients'
import AdminPageTasks from 'common/components/AdminIU/AdminPageTasks'
import s from './style.module.scss'
import { Roles } from '../../utils/constants'

const { TabPane } = Tabs

const AdminPage: React.FC = () => {
  return (
    <Tabs defaultActiveKey="1" className={s.Tabs}>
      <TabPane tab="Категорії" key="1">
        <AdminPageCategories />
      </TabPane>
      <TabPane tab="Клієнти" key="2">
        <AdminPageClients />
      </TabPane>
      <TabPane tab="Завдання" key="3">
        <AdminPageTasks />
      </TabPane>
    </Tabs>
  )
}
export default AdminPage

export async function getServerSideProps(context) {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/email/${session?.user?.email}`
  )
  const data = await response.json()
  const roles = data?.data?.roles

  if (!roles?.includes(Roles.GLOBAL_ADMIN)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
