import { Avatar, List, Typography } from 'antd'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '@common/api/userApi/user.api'
import { IComment } from '@modules/models/Task'
import classNames from 'classnames'
import { useSession } from 'next-auth/react'
import UserLink from '../UserLink'
import s from './style.module.scss'

const Comment: React.FC<{ comment: IComment; taskId: string }> = ({
  comment,
}) => {
  const session = useSession()
  const { data: sessionUser } = useGetUserByEmailQuery(
    session?.data?.user?.email
  )

  const { data: user } = useGetUserByIdQuery(comment.id)

  return (
      <List.Item
        className={classNames(s.Comment, {
          [s.Active]: sessionUser?.data?._id === user?._id,
        })}
      >
        <List.Item.Meta
          avatar={<Avatar src={user?.image || undefined} />}
          title={
            <>
              {user ? <UserLink user={user} /> : 'Власника не знайдено'}
            </>
          }
            description={<p className={s.Description}>{comment?.text}</p>}
          />        
      </List.Item>
  )
}

export default Comment
