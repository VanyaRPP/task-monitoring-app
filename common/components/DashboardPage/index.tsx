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
import { isAdminCheck } from '@utils/helpers'

const Dashboard: FC = () => {
  const { data: userResponse } = useGetCurrentUserQuery()
  const userRoles = userResponse?.roles
  const globalAdmin = userRoles?.includes(Roles.GLOBAL_ADMIN)
  const admin = isAdminCheck(userRoles)
  return (
    <>
      <DashboardHeader />
      <div className={s.Container}>
        {globalAdmin && (
          <>
            <StreetsBlock />
            <DomainsBlock />
          </>
        )}
      </div>
      <div className={s.Container}>{admin && <RealEstateBlock />}</div>
      <div className={s.Container}>
        <ServicesBlock />
        <PaymentsBlock />
      </div>
    </>
  )
}

export default Dashboard
