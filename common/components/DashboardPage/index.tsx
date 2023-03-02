import React, { FC } from 'react'
import Orders from './blocks/orders'
import Masters from './blocks/masters'
import Domains from './blocks/domains'
import Tasks from './blocks/tasks'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import CategoriesBlock from './blocks/categories'
import DashboardHeader from '../DashboardHeader'
import { Roles } from '@utils/constants'
import PaymentsWrapper from '../PaymentsWrapper'
import s from './style.module.scss'

const Dashboard: FC = () => {
  const { data } = useSession()
  const { data: userResponse } = useGetUserByEmailQuery(
    `${data?.user?.email}`,
    {
      skip: !data,
    }
  )
  const userRole = userResponse?.data?.role

  return (
    <>
      <DashboardHeader />
      <div className={s.Container}>
        <PaymentsWrapper />
        {userRole !== Roles.USER && <Tasks />}
        <Orders />
        {/* <CategoriesBlock />
        <Masters />
        <Domains /> */}
      </div>
    </>
  )
}

export default Dashboard
