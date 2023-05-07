import React, { FC } from 'react'
import DashboardHeader from '../DashboardHeader'
import PaymentsBlock from './blocks/payments'
import ServicesBlock from './blocks/services'
import s from './style.module.scss'
import RealEstateBlock from './blocks/realEstates'
import { Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

const Dashboard: FC = () => {
  return (
    <>
      <DashboardHeader />
      <div className={s.Container}>
        <PaymentsBlock />
        <ServicesBlock />
        <RealEstate />
      </div>
    </>
  )
}

export function RealEstate() {
  const { data: userResponse } = useGetCurrentUserQuery()
  const userRole = userResponse?.role

  return userRole === Roles.ADMIN && <RealEstateBlock />
}

export default Dashboard
