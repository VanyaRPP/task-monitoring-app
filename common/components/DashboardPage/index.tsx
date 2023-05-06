import React, { FC } from 'react'
import DashboardHeader from '../DashboardHeader'
import PaymentsBlock from './blocks/payments'
import ServicesBlock from './blocks/services'
import s from './style.module.scss'

const Dashboard: FC = () => {
  return (
    <>
      <DashboardHeader />
      <div className={s.Container}>
        <PaymentsBlock />
        <ServicesBlock />
      </div>
    </>
  )
}

export default Dashboard
