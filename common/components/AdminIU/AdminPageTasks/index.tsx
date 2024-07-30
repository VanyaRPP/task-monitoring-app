import { PlusOutlined } from '@ant-design/icons'
import { deleteExtraWhitespace } from '@assets/features/validators'
import { useGetAllTaskQuery } from '@common/api/taskApi/task.api'
import useDebounce from '@modules/hooks/useDebounce'
import { Button, Input } from 'antd'
import { useEffect, useState } from 'react'
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
          placeholder="Пошук завдання..."
          value={search}
          onChange={(e) => setSearch(deleteExtraWhitespace(e.target.value))}
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
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
      {tasks && <TasksList tasks={tasks} />}
    </>
  )
}

export default AdminPageTasks
