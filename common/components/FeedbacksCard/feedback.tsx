import { UserOutlined } from '@ant-design/icons'
import { useGetUserByIdQuery } from '@common/api/userApi/user.api'
import RateStars from '@components/UI/RateStars'
import { IFeedback } from '@modules/models/User'
import { Avatar, Image, List } from 'antd'
import s from './style.module.scss'

const Feedback: React.FC<{ feedback: IFeedback }> = ({ feedback }) => {
  const { data: user } = useGetUserByIdQuery(feedback.id)

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
