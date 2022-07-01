import { Button } from 'antd'
import { useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import { AppRoutes } from '../../utils/constants'
import s from './style.module.scss'

const TaskButton: React.FC = () => {
  const router = useRouter()
  const { status } = useSession()

  return status === 'authenticated' ? (
    <Button
      onClick={() => {
        router.route === AppRoutes.TASK
          ? Router.push(AppRoutes.ADD_TASK)
          : Router.push(AppRoutes.TASK)
      }}
      ghost
      type="primary"
      className={s.Button}
    >
      {router.route === AppRoutes.TASK ? 'Add task' : 'Tasks'}
    </Button>
  ) : null
}

export default TaskButton
