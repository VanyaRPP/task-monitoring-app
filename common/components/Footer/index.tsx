import { FC } from 'react'
import { Layout } from 'antd'
import s from './style.module.scss'

interface Props {
  style: React.CSSProperties
}

const Footer: FC<Props> = ({ style }) => {
  return (
    <Layout.Footer className={s.Footer} style={style}>
      <div className={s.Divider} />
      <h2>LOGO</h2>
      <span>© 2022 task-monitoring-app</span>
    </Layout.Footer>
  )
}

export default Footer
