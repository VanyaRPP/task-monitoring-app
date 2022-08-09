import { InfoOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Table } from 'antd'
import classNames from 'classnames'
import moment from 'moment'
import Router, { useRouter } from 'next/router'
import { AppRoutes, TaskStatuses } from '../../../utils/constants'
import {
  dateToDefaultFormat,
  isDeadlineExpired,
} from '../../assets/features/formatDate'
import { ITask } from '../../modules/models/Task'
import StatusTag from '../UI/StatusTag'
import s from './style.module.scss'

interface Props {
  task: ITask
}

const CardOneTask: React.FC<Props> = ({ task }) => {
  // const router = useRouter()
  // const columns = [
  //   {
  //     title: 'Назва',
  //     dataIndex: 'name',
  //     key: 'name',
  //     width: '16.6%',
  //     ellipsis: true,
  //     render: (text) => task.name,
  //   },
  //   {
  //     title: 'Статус',
  //     dataIndex: 'status',
  //     key: 'status',
  //     width: '16.6%',
  //     render: (status) => <StatusTag status={status} />,
  //   },
  //   {
  //     title: 'Категорія',
  //     dataIndex: 'category',
  //     key: 'category',
  //     width: '16.6%',
  //     ellipsis: true,
  //     render: (category) => task.category,
  //   },
  //   {
  //     title: 'Опис',
  //     dataIndex: 'description',
  //     key: 'description',
  //     width: '16.6%',
  //     ellipsis: true,
  //     render: (description) => task.description,
  //   },
  //   {
  //     title: 'Адреса',
  //     dataIndex: 'address',
  //     key: 'address',
  //     width: '16.6%',
  //     ellipsis: true,
  //     render: (address) => task.address.name,
  //   },
  //   {
  //     title: 'Дата',
  //     dataIndex: 'deadline',
  //     key: 'deadline',
  //     width: '16.6%',
  //     ellipsis: true,
  //     sorter: (a, b) => Date.parse(a?.deadline) - Date.parse(b?.deadline),
  //     render: (date) => moment(date).format('DD-MM hh:mm'),
  //   },
  // ]
  return (
    // <Table
    //   rowKey="_id"
    //   rowClassName={s.rowClass}
    //   showHeader={true}
    //   columns={columns}
    //   pagination={{
    //     responsive: false,
    //     size: 'small',
    //     pageSize: 5,
    //     position: ['bottomCenter'],
    //     hideOnSinglePage: true,
    //   }}
    //   onRow={(record, rowIndex) => {
    //     return {
    //       onClick: (event) => router.push(`${AppRoutes.TASK}/${record._id}`),
    //     }
    //   }}
    // />
    <Card
      onClick={() => Router.push(AppRoutes.TASK + '/' + task._id)}
      title={task.name}
      extra={
        <>
          <Badge
            color="gold"
            count={task?.taskexecutors ? task?.taskexecutors.length : 0}
          >
            <Button
              ghost
              type="primary"
              onClick={() => Router.push(AppRoutes.TASK + '/' + task._id)}
            >
              <InfoOutlined />
              {/* {'Info'} */}
            </Button>
          </Badge>
        </>
      }
      className={classNames(s.Card, {
        [s.Disabled]:
          task?.status === TaskStatuses.EXPIRED ||
          task?.status === TaskStatuses.ARCHIVED,
        [s.InWork]: task?.status === TaskStatuses.IN_WORK,
        [s.Completed]: task?.status === TaskStatuses.COMPLETED,
        [s.Rejected]: task?.status === TaskStatuses.REJECTED,
      })}
    >
      <p>Статус: {<StatusTag status={task?.status} />}</p>
      <p>Категорія: {task?.category}</p>
      <p>Опис: {task.description}</p>
      <p>Адреса: {task?.address?.name}</p>
      <p>Виконати до: {dateToDefaultFormat(task?.deadline)}</p>
    </Card>
  )
}

export default CardOneTask
