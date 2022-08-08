import { List, Avatar, Image, Rate } from 'antd'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import { UserOutlined } from '@ant-design/icons'
import { IFeedback } from 'common/modules/models/User'
import s from './style.module.scss'
import UserLink from '../UserLink'
import RateStars from '../UI/RateStars'

// const RateDescription = ['Terrible', 'Bad', 'Normal', 'Good', 'Wonderful']

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
        title={
          <h4>{user ? <UserLink user={user} /> : 'Замовника не знайдено'}</h4>
        }
        description={<p className={s.Description}>{feedback?.text}</p>}
      />
      <RateStars className={s.RateStar} value={feedback?.grade} disabled />
      {/* <Rate className={s.Rate} disabled value={feedback?.grade} /> */}
    </>
  )
}

export default Feedback
