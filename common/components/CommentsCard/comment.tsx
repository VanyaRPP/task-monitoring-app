import { List, Avatar, Image } from 'antd'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import { UserOutlined } from '@ant-design/icons'
import { IComment } from 'common/modules/models/Task'
import s from './style.module.scss'

const Comment: React.FC<{ comment: IComment }> = ({ comment }) => {
  const { data } = useGetUserByIdQuery(comment.id)
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
        description={<p className={s.Description}>{comment?.text}</p>}
      />
    </>
  )
}

export default Comment
