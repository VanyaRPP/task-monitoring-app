import React, { FC } from 'react'
import Orders from './blocks/orders'
import Masters from './blocks/masters'
import Domains from './blocks/domains'
import Tasks from './blocks/tasks'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import CategoriesBlock from './blocks/categories'
import PaymentsBlock from './blocks/payments'
import DashboardHeader from '../DashboardHeader'
import s from './style.module.scss'

const Dashboard: FC = () => {
  const session = useSession()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const userRole = userResponse?.data?.data?.role

  return (
    <>
      <DashboardHeader />
      <div className={s.Container}>
        <PaymentsBlock />
        {userRole !== 'User' ? <Tasks /> : null}
        <Orders />
        <CategoriesBlock />
        {/* <Masters />
        <Domains /> */}
      </div>
    </>
  )
}

export default Dashboard
