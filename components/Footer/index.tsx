import { FC } from 'react'
import s from './style.module.scss'
import { Layout } from 'antd'

const MainFooter: FC = () => {
  return (
    <Layout.Footer className={s.Footer}>
      <h2>LOGO</h2>
      <p>HZ CHO ZA SAIT</p>
    </Layout.Footer >
  )
}

export default MainFooter