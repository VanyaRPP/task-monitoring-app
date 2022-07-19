import React, { useState } from 'react'
import { List } from 'antd'
import { ITask } from 'common/modules/models/Task'
import TaskCard from 'common/components/TaskCard/index'
import s from './style.module.scss'
import { useGetTaskByIdQuery } from '../../../api/taskApi/task.api'

interface Props {
  tasks: ITask[]
}

const Tasks: React.FC<Props> = ({ tasks }) => {
  const [task, setTask] = useState(tasks[0])

  if (!tasks || tasks.length === 0)
    return <h2 style={{ color: 'var(--textColor)' }}>No tasks</h2>

  return (
    <div className={s.Container}>
      <List
        className={s.List}
        dataSource={tasks}
        renderItem={(item) => (
          <List.Item
            key={item._id}
            onClick={() => setTask(item)}
            className={`${s.ListItem} ${task._id === item._id ? s.Active : ''}`}
          >
            {item.name}
          </List.Item>
        )}
      />

      <TaskCard taskId={task._id} task={tasks[0]} />
    </div>
  )
}
export default Tasks
