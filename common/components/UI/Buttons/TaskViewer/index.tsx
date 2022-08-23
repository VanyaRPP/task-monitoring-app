import {
  AppstoreOutlined,
  ProfileOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import CardAllTasks from '@common/components/CardAllTasks'
import ListOneTask from '@common/components/ListOneTask'
import useLocalStorage from '@common/modules/hooks/useLocalStorage'
import { ITask } from '@common/modules/models/Task'
import { TaskView } from '@utils/constants'
import { Radio, Input, Select, Button } from 'antd'
import { useEffect, useState } from 'react'
import Filter from '../../Filtration'
import { deleteExtraWhitespace } from '@common/assets/features/validators'
import { TaskStatuses } from '@utils/constants'
import { useGetAllCategoriesQuery } from '@common/api/categoriesApi/category.api'
import { ICategory } from '@common/modules/models/Category'
import s from './style.module.scss'
import useDebounce from '@common/modules/hooks/useDebounce'

interface Props {
  tasks: ITask[]
}

const { Option } = Select

const TaskViewer: React.FC<Props> = ({ tasks }) => {
  const [taskView, setValue] = useLocalStorage('task-view', TaskView.CARD)
  const [view, setView] = useState(taskView)

  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  const [taskList, setTaskList] = useState(tasks)
  // const [sortedList, setSortedList] = useState(taskList)

  const [filters, setFilters] = useState({
    status: '',
    address: '',
    category: '',
  })
  const debounce = useDebounce(filters)

  // const [sorting, setSorting] = useState<string>(null)

  useEffect(() => {
    setTaskList(
      tasks?.filter(
        (data) =>
          (data?.status?.localeCompare(debounce?.status) === 0 ||
            debounce?.status === '') &&
          (data?.address?.name
            ?.toLowerCase()
            .includes(debounce?.address?.toLowerCase()) ||
            debounce?.address === '') &&
          (data?.category?.localeCompare(debounce?.category) === 0 ||
            debounce?.category === '')
      )
    )
  }, [debounce, setTaskList, tasks])

  return (
    <>
      <div className={s.Filtration}>
        <div>
          <Select
            showSearch
            placeholder="Статус"
            optionFilterProp="children"
            value={filters.status || undefined}
            onChange={(value) =>
              setFilters({ ...filters, status: deleteExtraWhitespace(value) })
            }
            filterOption={(input, option) =>
              (option!.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {Object.entries(TaskStatuses).map((key, index) => (
              <Option key={index} value={key[1]}>
                {key[1]}
              </Option>
            ))}
          </Select>
          <Button
            onClick={() => {
              setFilters({ ...filters, status: '' })
            }}
          >
            <ReloadOutlined />
          </Button>
        </div>

        <div>
          <Input
            placeholder={'Адреса'}
            value={filters.address}
            onChange={(e) =>
              setFilters({
                ...filters,
                address: deleteExtraWhitespace(e.target.value),
              })
            }
          />
          <Button
            onClick={() => {
              setFilters({ ...filters, address: '' })
            }}
          >
            <ReloadOutlined />
          </Button>
        </div>

        <div>
          <Select
            showSearch
            placeholder="Категорія"
            optionFilterProp="children"
            value={filters.category || undefined}
            onChange={(value) =>
              setFilters({ ...filters, category: deleteExtraWhitespace(value) })
            }
            filterOption={(input, option) =>
              (option!.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {categories?.map((data, index) => (
              <Option key={index} value={data?.name}>
                {data?.name}
              </Option>
            ))}
          </Select>

          <Button
            onClick={() => {
              setFilters({ ...filters, category: '' })
            }}
          >
            <ReloadOutlined />
          </Button>
        </div>

        {/* {taskView === TaskView.CARD && (
          <div>
            <Button
              className={s.SortButton}
              onClick={() =>
                setSorting(
                  sorting === 'ascendary'
                    ? 'descendary'
                    : sorting === 'descendary'
                    ? null
                    : 'ascendary'
                )
              }
            >
              Sort by date
            </Button>
          </div>
        )} */}
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

      {taskView === TaskView.CARD ? (
        <CardAllTasks tasks={taskList} />
      ) : (
        <ListOneTask tasks={taskList} />
      )}
    </>
  )
}

export default TaskViewer
