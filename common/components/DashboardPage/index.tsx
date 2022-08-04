import React, { useState } from 'react'
import Orders from './blocks/orders'
import Masters from './blocks/masters'
import Domains from './blocks/domains'
import { Button } from 'antd'
import AddTaskModal from '../AddTaskModal'
import s from './style.module.scss'
import Tasks from './blocks/tasks'

const Dashboard: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  // const router = useRouter()
  // const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  // const user = userResponse?.data?.data
  // const tasksResponse = useGetAllTaskQuery('')
  // const tasks = tasksResponse?.data?.data
  return (
    <>
      <div className={s.Header}>
        <h1>Дошка</h1>
        <Button
          ghost
          type="primary"
          onClick={() => setIsModalVisible(!isModalVisible)}
        >
          Створити завдання
        </Button>
      </div>

      <div className={s.Container}>
        <Orders style={`${s.Card} ${s.Orders}`} />
        <Tasks style={`${s.Card} ${s.Orders}`} />
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
