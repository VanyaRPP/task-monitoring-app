import { List, Avatar, Image, Rate } from 'antd'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import { UserOutlined } from '@ant-design/icons'
import { IFeedback } from 'common/modules/models/User'
import s from './style.module.scss'
import UserLink from '../UserLink'
import RateStars from '../UI/RateStars'

const DrawerFeedback: React.FC<{ feedback: IFeedback }> = ({ feedback }) => {
  const { data } = useGetUserByIdQuery(feedback.id)
  const user = data?.data

  return (
    <>
      <div className={s.UserInfo}>
        <Avatar
          icon={<UserOutlined />}
          src={<Image src={user?.image || undefined} alt="User" />}
        />
        <h4>{user ? <p>{user?.name}</p> : 'Замовника не знайдено'}</h4>
      </div>
      <p className={s.Description}>{feedback?.text}</p>
      <RateStars className={s.RateStar} value={feedback?.grade} disabled />
    </>
  )
}

export default DrawerFeedback
