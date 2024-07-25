import {
  FieldTimeOutlined,
  FireOutlined,
  InfoOutlined,
} from '@ant-design/icons'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import StatusTag from '@components/UI/StatusTag'
import { ITask } from '@modules/models/Task'
import { AppRoutes, TaskStatuses } from '@utils/constants'
import { getFormattedAddress } from '@utils/helpers'
import { Badge, Button, Card } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Router from 'next/router'
import s from './style.module.scss'

interface Props {
  task: ITask
}

const CardOneTask: React.FC<Props> = ({ task }) => {
  const deadline = task?.deadline
  const dateDiff = dayjs(deadline).diff(dayjs(new Date()), 'days')

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
      <div className={s.CardInfo}>
        <p>Статус: {<StatusTag status={task?.status} />}</p>
        <p>Категорія: {task?.category}</p>
        <p>Опис: {task.description}</p>
        <p>Адреса: {getFormattedAddress(task?.address?.name)}</p>
        <p
          className={classNames(s.Column, {
            [s.CloseDateColumn]: dateDiff <= 1 && dateDiff >= 0,
            [s.OutDateColumn]: dateDiff < 0,
          })}
        >
          Виконати до: {dateToDefaultFormat(task?.deadline)}
          {dateDiff <= 1 && dateDiff >= 0 ? (
            <FireOutlined className={s.Icon} />
          ) : dateDiff < 0 ? (
            <FieldTimeOutlined className={s.Icon} />
          ) : null}
        </p>
      </div>
    </Card>
  )
}

export default CardOneTask
