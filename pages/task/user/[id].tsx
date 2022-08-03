import { Button, Checkbox, Empty, Radio, RadioChangeEvent } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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
  const [taskList, setTaskList] = useState(tasks)
  const [filter, setFilter] = useState('')

  const resetFilters = () => {
    setFilter(null)
    setTaskList(tasks)
  }

  useEffect(() => {
    setTaskList(tasks?.filter((task: ITask) => task.status === filter))
  }, [filter, tasks])

  useEffect(() => {
    setTaskList(tasks)
  }, [])

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

      <div className={s.Filtration}>
        <Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)}>
          {Object.entries(TaskStatuses).map((key) => {
            return (
              <Radio key={key[1]} value={key[1]} className={s.Filter}>
                {key[1]}
              </Radio>
            )
          })}
          <Button type="primary" onClick={() => resetFilters()}>
            X
          </Button>
        </Radio.Group>
      </div>
      {taskList?.length !== 0 ? (
        <div className={s.TasksList}>
          {taskList &&
            taskList.map((task: ITask, index) => {
              return <CardOneTask key={index} task={task} />
            })}
        </div>
      ) : filter?.length == 0 && tasks?.length !== 0 ? (
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
