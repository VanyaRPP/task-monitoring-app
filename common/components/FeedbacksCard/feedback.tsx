import { List, Avatar, Image } from 'antd'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import { StarOutlined, UserOutlined } from '@ant-design/icons'
import { IFeedback } from 'common/modules/models/User'
import s from './style.module.scss'

const Feedback: React.FC = ({ feedback }: { feedback: IFeedback }) => {
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
        title={user ? user?.name : 'User not found'}
        description={<p className={s.Description}>{feedback?.text}</p>}
      />
      <span>
        {feedback?.grade} / 5 <StarOutlined />
      </span>
    </>
  )
}

export default Feedback
