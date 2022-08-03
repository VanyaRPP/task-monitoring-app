import { Badge, Button, Card } from 'antd'
import classNames from 'classnames'
import Router from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import {
  dateToDefaultFormat,
  isDeadlineExpired,
} from '../../assets/features/formatDate'
import { ITask } from '../../modules/models/Task'
import s from './style.module.scss'

interface Props {
  task: ITask
}

const CardOneTask: React.FC<Props> = ({ task }) => {
  return (
    <Card
      title={task.name}
      extra={
        <Badge
          color="gold"
          count={task?.taskexecutors ? task?.taskexecutors.length : 0}
        >
          <Button
            ghost
            type="primary"
            onClick={() => Router.push(AppRoutes.TASK + '/' + task._id)}
          >
            {isDeadlineExpired(task?.deadline) ? 'Інформація' : 'Подати заявку'}
          </Button>
        </Badge>
      }
      className={classNames(s.Card, {
        [s.Disabled]: isDeadlineExpired(task?.deadline),
      })}
    >
      <p>Статус: {task?.status}</p>
      <p>Категорія: {task?.category}</p>
      <p>Опис: {task.description}</p>
      <p>Адреса: {task?.address?.name}</p>
      <p>Виконати до: {dateToDefaultFormat(task?.deadline)}</p>
    </Card>
  )
}

export default CardOneTask
