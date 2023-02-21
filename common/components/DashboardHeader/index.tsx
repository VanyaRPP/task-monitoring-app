import { Button } from 'antd'
import React, { useState } from 'react'
import AddTaskModal from '../AddTaskModal'
import { BackButton, TaskButton } from '../UI/Buttons'
import s from './style.module.scss'

const DashboardHeader = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  return (
    <>
      <div className={s.Header}>
        {/* <BackButton /> */}
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
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
    </>
  )
}

export default DashboardHeader
