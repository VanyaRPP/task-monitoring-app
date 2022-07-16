import { Button, Tabs } from 'antd'
import { useGetAllTaskQuery } from 'common/api/taskApi/task.api'
import s from './style.module.scss'
import TaskCard from 'common/components/TaskCard/index'
import Search from 'antd/lib/input/Search'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import AddTaskModal from '../../AddTaskModal/index'

const AdminPageTasks: React.FC = () => {
  const { TabPane } = Tabs

  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  return (
    <>
      <div className={s.Controls}>
        <Search
          className={s.Search}
          placeholder="input search text"
          onSearch={() => console.log('search')}
          enterButton
        />
        <Button
          className={s.AddButton}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        />
        <AddTaskModal
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
        />
      </div>
      <div className={s.Content}>
        <Tabs type="card" tabPosition="left">
          {tasks &&
            tasks.map((task) => (
              <TabPane className={s.TabPane} tab={task.name} key={task._id}>
                <TaskCard taskId={task._id} />
              </TabPane>
            ))}
        </Tabs>
      </div>
    </>
  )
}

export default AdminPageTasks
