import { FC } from 'react'
import { Layout } from 'antd'
import s from './style.module.scss'
import Logo from '../Logo'

interface Props {
  style?: React.CSSProperties
}

const Footer: FC<Props> = ({ style }) => {
  return (
    <Layout.Footer className={s.Footer} style={style}>
      <div className={s.Divider} />
      <div className={s.Content}>
        <Logo />
      </div>
    </Layout.Footer>
  )
}

export default Footer
