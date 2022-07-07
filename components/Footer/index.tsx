import { FC } from 'react'
import s from './style.module.scss'
import { Layout } from 'antd'

interface Props {
  style: React.CSSProperties
}

const MainFooter: FC<Props> = ({ style }) => {
  return (
    <Layout.Footer className={s.Footer} style={style}>
      <div className={s.Divider} />
      <h2>LOGO</h2>
      <p>HZ CHO ZA SAIT</p>
    </Layout.Footer>
  )
}

export default MainFooter
