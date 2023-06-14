import { Button } from 'antd'
import { useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import { useState } from 'react'
import { AppRoutes, Roles } from '../../../../../utils/constants'
import { useGetUserByEmailQuery } from '../../../../api/userApi/user.api'
import AddTaskModal from '../../../AddTaskModal'
import s from './style.module.scss'

const TaskButton: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const router = useRouter()
  const { data: session, status } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  const taskButton = () => {
    if (
      user?.roles.includes(Roles.WORKER) ||
      user?.roles.includes(Roles.GLOBAL_ADMIN)
    ) {
      return (
        <Button
          onClick={() => {
            router.route === AppRoutes.TASK
              ? setIsModalVisible(true)
              : Router.push(AppRoutes.TASK)
          }}
          ghost
          type="link"
          className={s.Button}
        >
          {router.route === AppRoutes.TASK
            ? 'Створити завдання'
            : 'Всі завдання'}
        </Button>
      )
    }
  }

  return status === 'authenticated' ? (
    <>
      {taskButton()}
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
    </>
  ) : null
}

export default TaskButton
