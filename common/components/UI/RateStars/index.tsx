import { Rate } from 'antd'
import s from './style.module.scss'

interface Props {
  value: number
}

const RateStars: React.FC<any> = (props) => {
  return <Rate className={s.Rate} {...props} />
}

export default RateStars
