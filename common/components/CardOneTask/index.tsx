import { InfoOutlined } from '@ant-design/icons'
import { Badge, Button, Card } from 'antd'
import classNames from 'classnames'
import Router from 'next/router'
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
  return (
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
