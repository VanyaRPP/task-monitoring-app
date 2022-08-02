import { Button, Checkbox, Empty, Radio, RadioChangeEvent } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import task from '..'
import { useGetAllTaskQuery } from '../../../common/api/taskApi/task.api'
import AddTaskModal from '../../../common/components/AddTaskModal'
import CardOneTask from '../../../common/components/CardOneTask'
import Filter from '../../../common/components/UI/FiltrationSidebar'
import { ITask } from '../../../common/modules/models/Task'
import { AppRoutes, TaskStatuses } from '../../../utils/constants'
import { authOptions } from '../../api/auth/[...nextauth]'
import s from './../style.module.scss'

const UserTasks: React.FC = () => {
  const router = useRouter()
  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [taskList, setTaskList] = useState([])
  const [filter, setFilter] = useState('')

  const resetFilters = () => {
    setFilter(null)
    setTaskList([])
  }

  useEffect(() => {
    // console.log(filter, 'filter')
    setTaskList(tasks?.filter((task: ITask) => task.status === filter))
    // console.log(taskList)
  }, [filter, tasks])

  useEffect(() => {
    setTaskList(tasks)
    // console.log(tasks)
  }, [])

  const keys = Object.keys(TaskStatuses)
  const values = Object.values(TaskStatuses)

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
      {taskList && taskList.length !== 0 ? (
        <div className={s.TasksList}>
          {taskList &&
            taskList.map((task: ITask, index) => {
              return <CardOneTask key={index} task={task} />
            })}
        </div>
      ) : tasks && tasks.length !== 0 ? (
        <div className={s.TasksList}>
          {tasks &&
            tasks.map((task: ITask, index) => {
              return <CardOneTask key={index} task={task} />
            })}
        </div>
      ) : (
        <Empty description="Немає даних" />
      )}

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
