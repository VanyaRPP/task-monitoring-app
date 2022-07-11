import { Spin } from 'antd'
import style from './style.module.scss'
import { LoadingOutlined } from '@ant-design/icons'

const Preloader: React.FC = () => {
  return (
    <Spin
      className={style.Preloader}
      size="large"
      indicator={<LoadingOutlined className={style.Icon} spin />}
    />
  )
}
export default Preloader
