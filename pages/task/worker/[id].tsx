import { Button, Checkbox, Empty, Radio, RadioChangeEvent, Input } from 'antd'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useMemo } from 'react'
import task from '..'
import { useGetAllTaskQuery } from '../../../common/api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../../common/api/userApi/user.api'
import AddTaskModal from '../../../common/components/AddTaskModal'
import CardOneTask from '../../../common/components/CardOneTask'
import { ITask } from '../../../common/modules/models/Task'
import { AppRoutes, TaskStatuses } from '../../../utils/constants'
import { authOptions } from '../../api/auth/[...nextauth]'
import s from './../style.module.scss'

const WorkerTasks: React.FC = () => {
  const session = useSession()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const user = userResponse?.data?.data
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data
  const [filter, setFilter] = useState('')
  const [taskList, setTaskList] = useState([])

  const resetFilters = () => {
    setFilter(null)
    setTaskList([])
  }

  const dataSource = useMemo(() => {
    return tasks?.filter((task) => task?.executant === user?._id)
  }, [tasks, user?._id])

  useEffect(() => {
    setTaskList(dataSource?.filter((task: ITask) => task.status === filter))
  }, [filter, dataSource])

  useEffect(() => {
    setTaskList(dataSource)
  }, [])

  return (
    <>
      <div className={s.Header}>
        <h1>Мої замовлення</h1>
      </div>
      {/* <div>
          <Filter />
        </div> */}
      <div>
        {/* <Button
            ghost
            type="primary"
            onClick={() => setFilter(TaskStatuses.PENDING)}
          >
            Pending
          </Button>
          <Button
            ghost
            type="primary"
            onClick={() => setFilter(TaskStatuses.IN_WORK)}
          >
            In work
          </Button>
          <Button ghost type="primary" onClick={() => resetFilters()}>
            X
          </Button> */}
        <Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)}>
          {/* {Object.values(TaskStatuses).forEach((keys) => {
            return <Radio value={values}>{values}</Radio>
          })} */}
          <Radio value={TaskStatuses.PENDING}>В очікуванні</Radio>
          <Radio value={TaskStatuses.IN_WORK}>В роботі</Radio>
        </Radio.Group>
        <Button type="primary" onClick={() => resetFilters()}>
          X
        </Button>
      </div>
      {taskList?.length !== 0 ? (
        <div className={s.TasksList}>
          {taskList?.map((task: ITask, index) => {
            return <CardOneTask key={index} task={task} />
          })}
        </div>
      ) : dataSource?.length !== 0 ? (
        <div className={s.TasksList}>
          {dataSource?.map((task: ITask, index) => {
            return <CardOneTask key={index} task={task} />
          })}
        </div>
      ) : (
        <Empty description="Немає даних" />
      )}

      {/* <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      /> */}
    </>
  )
}

export default WorkerTasks

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
