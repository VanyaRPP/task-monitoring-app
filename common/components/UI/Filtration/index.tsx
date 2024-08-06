import { ITask } from '@modules/models/Task'
import { TaskStatuses } from '@utils/constants'
import { Empty, Radio } from 'antd'
import { useEffect, useState } from 'react'
import CardOneTask from '../../CardOneTask'
import s from './style.module.scss'

interface Props {
  // tasks: [ITask]
  tasks: any
}
const Filter: React.FC<Props> = ({ tasks }) => {
  // const { data } = useGetAllTaskQuery('')
  // const tasks = data?.data
  const [taskList, setTaskList] = useState(tasks)
  const [filter, setFilter] = useState('')

  const resetFilters = () => {
    setFilter('')
    setTaskList(tasks)
  }

  useEffect(() => {
    setTaskList(tasks?.filter((task: ITask) => task.status === filter))
  }, [filter, tasks])

  useEffect(() => {
    setTaskList(tasks)
  }, [tasks])

  return (
    <>
      <div className={s.Filtration}>
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          {Object.entries(TaskStatuses).map((key) => {
            return (
              <Radio
                key={key[1]}
                value={key[1]}
                className={s.Filter}
                onClick={() => resetFilters()}
              >
                {key[1]}
              </Radio>
            )
          })}
        </Radio.Group>
      </div>
      {taskList?.length !== 0 ? (
        <div className={s.TasksList}>
          {taskList &&
            taskList
              .slice(0)
              .reverse()
              .map((task: ITask, index) => {
                return <CardOneTask key={index} task={task} />
              })}
        </div>
      ) : filter?.length === 0 && tasks?.length !== 0 ? (
        <div className={s.TasksList}>
          {tasks &&
            tasks
              .slice(0)
              .reverse()
              .map((task: ITask, index) => {
                return <CardOneTask key={index} task={task} />
              })}
        </div>
      ) : (
        <Empty description="Немає даних" className={s.Empty} />
      )}
    </>
  )
}

export default Filter
