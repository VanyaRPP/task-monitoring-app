import { FieldTimeOutlined, FireOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import dayjs from 'dayjs'
import s from './style.module.scss'

interface Props {
  deadline: Date | string | undefined
}

const ListItemDeadline: React.FC<Props> = ({ deadline }) => {
  const taskDeadline = dayjs(deadline).format('DD-MM hh:mm')
  const dateDiff = dayjs(deadline).diff(dayjs(new Date()), 'days')
  return (
    <>
      <p
        className={classNames(s.Column, {
          [s.CloseDateColumn]: dateDiff <= 1 && dateDiff >= 0,
          [s.OutDateColumn]: dateDiff < 0,
        })}
      >
        {taskDeadline}
        {dateDiff <= 1 && dateDiff >= 0 ? (
          <FireOutlined className={s.Icon} />
        ) : dateDiff < 0 ? (
          <FieldTimeOutlined className={s.Icon} />
        ) : null}
      </p>
    </>
  )
}

export default ListItemDeadline
