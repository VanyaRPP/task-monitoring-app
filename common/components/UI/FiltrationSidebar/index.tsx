import { Button, Empty } from 'antd'
import { useEffect, useState } from 'react'
import { TaskStatuses } from '../../../../utils/constants'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { ITask } from '../../../modules/models/Task'
import CardOneTask from '../../CardOneTask'
import s from './style.module.scss'

const Filter: React.FC = () => {
  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

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

  return (
    <>
      <div>
        <Button
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
        <Empty />
      )}
    </>
  )
}

export default Filter
