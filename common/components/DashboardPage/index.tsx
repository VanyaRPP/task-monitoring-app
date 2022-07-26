import React from 'react'
import Orders from './blocks/orders'
import Masters from './blocks/masters'
import Domains from './blocks/domains'
import s from './style.module.scss'
import { Button, Card, Empty } from 'antd'
import { ITask } from '../../modules/models/Task'
import Router, { useRouter } from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import {
  dateToDefaultFormat,
  isDeadlineExpired,
} from '../../assets/features/formatDate'
import classNames from 'classnames'
import { useGetAllTaskQuery } from '../../api/taskApi/task.api'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'

const Dashboard: React.FC = () => {
  return (
    <>
      <div className={s.Header}>
        <h1>Дошка</h1>
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
