import { Card } from 'antd'
import classNames from 'classnames'
import Graphic from '../../../components/UI/TableCard'

import s from './style.module.scss'

interface Props {
  children?: React.ReactNode
  title?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const TableCard: React.FC<Props> = ({ children, title, className, style }) => {
  const head = <div className={s.Head}>{title}</div>
  const body = <div className={s.Body}>{children}</div>

  return (
    <Card className={classNames(s.Card, className)} style={style} title={head}>
      {body}
    </Card>
  )
}

export default TableCard
