import { Spin } from 'antd'
import s from './style.module.scss'
import { LoadingOutlined } from '@ant-design/icons'

const Preloader: React.FC = () => {
  return (
    <Spin
      className={s.Preloader}
      size="large"
      indicator={<LoadingOutlined className={s.Icon} spin />}
    />
  )
}
export default Preloader
