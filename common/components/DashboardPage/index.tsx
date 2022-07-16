import React from 'react'
import Orders from './blocks/orders'
import Masters from './blocks/masters'
import Domains from './blocks/domains'
import s from './style.module.scss'

const Dashboard: React.FC = () => {
  return (
    <>
      <div className={s.Header}>
        <h1>Dashboard</h1>
      </div>

      <div className={s.Container}>
        <Orders style={`${s.Card} ${s.Orders}`} />
        <Masters style={`${s.Card} ${s.Masters}`} />
        <Domains style={`${s.Card} ${s.Domains}`} />
      </div>
    </>
  )
}

export default Dashboard
