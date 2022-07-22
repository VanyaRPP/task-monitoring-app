import { Button } from 'antd'
import { useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import { useState } from 'react'
import { AppRoutes } from '../../../../../utils/constants'
import AddTaskModal from '../../../AddTaskModal'
import s from './style.module.scss'

const TaskButton: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const router = useRouter()
  const { status } = useSession()

  return status === 'authenticated' ? (
    <>
      <Button
        onClick={() => {
          router.route === AppRoutes.TASK
            ? setIsModalVisible(true)
            : Router.push(AppRoutes.TASK)
        }}
        ghost
        type="primary"
        className={s.Button}
      >
        {router.route === AppRoutes.TASK ? 'Створити завдання' : 'Завдання'}
      </Button>
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
    </>
  ) : null
}

export default TaskButton
