import React, { useState } from 'react'
import Orders from './blocks/orders'
import Masters from './blocks/masters'
import Domains from './blocks/domains'
import { Button } from 'antd'
import AddTaskModal from '../AddTaskModal'
import s from './style.module.scss'
import Tasks from './blocks/tasks'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import CategoriesBlock from './blocks/categories'
import { TaskButton } from '../UI/Buttons'

const Dashboard: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const session = useSession()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const userRole = userResponse?.data?.data?.role

  return (
    <>
      <div className={s.Header}>
        <h1>Дошка</h1>
        <div className={s.Buttons}>
          <Button
            className={s.Button}
            ghost
            type="primary"
            onClick={() => setIsModalVisible(!isModalVisible)}
          >
            Створити завдання
          </Button>
          <TaskButton />
        </div>
      </div>

      <div className={s.Container}>
        {userRole !== 'User' ? <Tasks style={`${s.Card} ${s.Orders}`} /> : null}
        <Orders style={`${s.Card} ${s.Orders}`} />
        <CategoriesBlock style={`${s.Card} ${s.Orders}`} />
        {/* <Masters style={`${s.Card} ${s.Masters}`} />
        <Domains style={`${s.Card} ${s.Domains}`} /> */}
      </div>
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
    </>
  )
}

export default Dashboard
