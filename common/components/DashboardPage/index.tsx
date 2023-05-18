import React, { FC } from 'react'
import DashboardHeader from '../DashboardHeader'
import PaymentsBlock from './blocks/payments'
import ServicesBlock from './blocks/services'
import s from './style.module.scss'
import RealEstateBlock from './blocks/realEstates'
import DomainsBlock from './blocks/domains'
import { Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import StreetsBlock from './blocks/streets'

const Dashboard: FC = () => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const userRole = userResponse?.role

  return (
    <>
      <DashboardHeader />
      <div className={s.Container}>
        {userRole === Roles.ADMIN && (
          <>
            <DomainsBlock />
            <StreetsBlock />
          </>
        )}
      </div>
      <div className={s.Container}>
        <PaymentsBlock />
        <ServicesBlock />
      </div>
      <div className={s.Container}>
        {userRole === Roles.ADMIN && <RealEstateBlock />}
      </div>
    </>
  )
}

export default Dashboard
