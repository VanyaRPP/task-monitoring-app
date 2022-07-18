import { useState, useEffect } from 'react'
import useDebounce from 'common/assets/hooks/useDebounce'
import { Button, Input } from 'antd'
import Search from 'antd/lib/input/Search'
import { useGetAllTaskQuery } from 'common/api/taskApi/task.api'
import { PlusOutlined } from '@ant-design/icons'
import AddTaskModal from '../../AddTaskModal/index'
import Tasks from './TasksList'
import s from './style.module.scss'

const AdminPageTasks: React.FC = () => {
  const { data } = useGetAllTaskQuery('')

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const [tasks, setTasks] = useState(data?.data)
  const [search, setSearch] = useState('')
  const debounced = useDebounce<string>(search)

  // const searchTask = () => {
  //   console.log(search)
  //   setTasks(
  //     data?.data.filter((item) =>
  //       item.name.toLowerCase().includes(search.toLowerCase())
  //     )
  //   )
  // }

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
        {/* <Search
          value={search}
          className={s.Search}
          placeholder="Task name"
          onChange={(e) => setSearch(e.target.value)}
          onSearch={searchTask}
          enterButton
        />
        <Button
          className={s.AddButton}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        /> */}
        <Input
          placeholder="Search Task..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <AddTaskModal
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
        />
      </div>
      <Tasks tasks={tasks} />
    </>
  )
}

export default AdminPageTasks
