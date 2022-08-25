import { AppstoreOutlined, ProfileOutlined } from '@ant-design/icons'
import CardAllTasks from '@common/components/CardAllTasks'
import ListOneTask from '@common/components/ListOneTask'
import useLocalStorage from '@common/modules/hooks/useLocalStorage'
import { ITask } from '@common/modules/models/Task'
import { useAppSelector } from '@common/modules/store/hooks'
import { TaskView } from '@utils/constants'
import { Radio } from 'antd'
import { useState } from 'react'
import BackButton from '../BackButton'
import s from './style.module.scss'

interface Props {
  tasks: ITask[]
}
const TaskViewer: React.FC<Props> = ({ tasks }) => {
  const [taskView, setValue] = useLocalStorage('task-view', TaskView.CARD)
  const [view, setView] = useState(taskView)
  // const { viewer } = useAppSelector((state)=>state.taskApi)
  return (
    <>
      <div className={s.Opportunities}>
        <div className={s.Button}>
          <BackButton />
        </div>
        <div className={s.Buttons}>
          <Radio.Group
            defaultValue={TaskView.CARD}
            buttonStyle="solid"
            onChange={(e) => setValue(e.target.value)}
          >
            <Radio.Button
              value={TaskView.CARD}
              onChange={() => {
                setView(taskView)
              }}
            >
              <AppstoreOutlined />
            </Radio.Button>
            <Radio.Button
              value={TaskView.LIST}
              onChange={() => {
                setView(taskView)
              }}
            >
              <ProfileOutlined />
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>
      {taskView === TaskView.CARD ? (
        <CardAllTasks tasks={tasks} />
      ) : (
        <ListOneTask tasks={tasks} />
      )}
    </>
  )
}

export default TaskViewer
