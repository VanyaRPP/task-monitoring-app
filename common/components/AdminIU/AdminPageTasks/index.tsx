import { Tabs } from 'antd'
import { useGetAllTaskQuery } from 'common/api/taskApi/task.api'

import TaskCard from 'common/components/TaskCard/index'

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
