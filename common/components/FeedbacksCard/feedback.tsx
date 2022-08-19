import { List, Avatar, Image, Rate } from 'antd'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import { UserOutlined } from '@ant-design/icons'
import { IFeedback } from 'common/modules/models/User'
import s from './style.module.scss'
import RateStars from '../UI/RateStars'

const Feedback: React.FC<{ feedback: IFeedback }> = ({ feedback }) => {
  const { data } = useGetUserByIdQuery(feedback.id)
  const user = data?.data

  return (
    <>
      <List.Item.Meta
        avatar={
          <Avatar
            icon={<UserOutlined />}
            src={<Image src={user?.image || undefined} alt="User" />}
          />
        }
        title={<h4>{user ? <p>{user?.name}</p> : 'Замовника не знайдено'}</h4>}
        description={<p className={s.Description}>{feedback?.text}</p>}
      />
      <RateStars className={s.RateStar} value={feedback?.grade} disabled />
    </>
  )
}

export default Feedback
