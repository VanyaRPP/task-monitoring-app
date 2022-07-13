import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import s from './style.module.scss'

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
