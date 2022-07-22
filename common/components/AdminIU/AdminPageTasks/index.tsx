import { useState, useEffect } from 'react'
import useDebounce from 'common/modules/hooks/useDebounce'
import { Button, Input } from 'antd'
import { useGetAllTaskQuery } from 'common/api/taskApi/task.api'
import { PlusOutlined } from '@ant-design/icons'
import AddTaskModal from '../../AddTaskModal/index'
import TasksList from './TasksList'
import s from './style.module.scss'

const AdminPageTasks: React.FC = () => {
  const { data } = useGetAllTaskQuery('')

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const [tasks, setTasks] = useState(data?.data)
  const [search, setSearch] = useState('')
  const debounced = useDebounce<string>(search)

  useEffect(() => {
    setTasks(
      data?.data.filter((item) =>
        item.name.toLowerCase().includes(debounced.toLowerCase())
      )
    )
  }, [debounced, data])

  return (
    <>
      <div className={s.Controls}>
        <Input
          placeholder="Search Task..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          className={s.AddButton}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        />
      </div>
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
      {tasks && <TasksList tasks={tasks} />}
    </>
  )
}

export default AdminPageTasks
