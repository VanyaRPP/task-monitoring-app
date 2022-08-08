import { Button, Checkbox, Empty, Radio } from 'antd'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useGetAllTaskQuery } from '../../../common/api/taskApi/task.api'
import AddTaskModal from '../../../common/components/AddTaskModal'
import CardOneTask from '../../../common/components/CardOneTask'
import Filter from '../../../common/components/UI/Filtration/index'
import { ITask } from '../../../common/modules/models/Task'
import { AppRoutes } from '../../../utils/constants'
import { authOptions } from '../../api/auth/[...nextauth]'
import s from './../style.module.scss'

const UserTasks: React.FC = () => {
  const router = useRouter()
  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data
  const [taskList, setTaskList] = useState(tasks)
  const [sorting, setSorting] = useState('')

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  // useEffect(() => {
  //   setTaskList(
  //     tasks?.sort((a: ITask, b: ITask) =>
  //       a.address.name.localeCompare(b.address.name)
  //     )
  //   )
  // }, [sorting, tasks])

  // useEffect(() => {
  //   setTaskList(tasks)
  // }, [])

  return (
    <>
      <div className={s.Header}>
        <h1>Мої замовлення</h1>
        <Button
          ghost
          type="primary"
          onClick={() => setIsModalVisible(!isModalVisible)}
        >
          Створити завдання
        </Button>
      </div>
      {/* <Radio.Group value={sorting} onChange={(e) => setSorting(e.target.value)}>
        <Radio>За адресою</Radio>
      </Radio.Group>
      {taskList?.length !== 0 ? (
        <div className={s.TasksList}>
          {taskList &&
            taskList.map((task: ITask, index) => {
              return <CardOneTask key={index} task={task} />
            })}
        </div>
      ) : sorting?.length === 0 && tasks?.length !== 0 ? (
        <div className={s.TasksList}>
          {tasks &&
            tasks.map((task: ITask, index) => {
              return <CardOneTask key={index} task={task} />
            })}
        </div>
      ) : (
        <Empty description="Немає даних" className={s.Empty} />
      )} */}
      <Filter />
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
    </>
  )
}

export default UserTasks

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      redirect: {
        destination: AppRoutes.AUTH_SIGN_IN,
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
