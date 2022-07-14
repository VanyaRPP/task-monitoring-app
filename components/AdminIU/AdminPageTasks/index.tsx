import { Skeleton, Tabs } from 'antd'
import Card from 'antd/lib/card/Card'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import s from './style.module.scss'
import Meta from 'antd/lib/card/Meta'
import TaskCard from '../../TaskCard'
import { useState } from 'react'

const AdminPageTasks: React.FC = () => {
  const { TabPane } = Tabs

  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

  return (
    <Tabs type="card" tabPosition="left">
      {tasks &&
        tasks.map((task) => (
          <TabPane tab={task.name} key={task._id}>
            <TaskCard taskId={task._id} />
          </TabPane>
        ))}
    </Tabs>
  )
}

export default AdminPageTasks
