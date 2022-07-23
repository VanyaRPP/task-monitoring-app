import { Comment as CommentAntd } from 'antd'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import { IComment } from 'common/modules/models/Task'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import classNames from 'classnames'
import moment from 'moment'
import s from './style.module.scss'

const Comment: React.FC<{ comment: IComment; taskId: string }> = ({
  comment,
}) => {
  const session = useSession()
  const { data: sessionUser } = useGetUserByEmailQuery(
    session?.data?.user?.email
  )

  const { data } = useGetUserByIdQuery(comment.id)
  const user = data?.data

  return (
    <>
      <CommentAntd
        className={classNames(s.Comment, {
          [s.Active]: sessionUser?.data?._id === user?._id,
        })}
        author={user ? user?.name : 'User not found'}
        avatar={user?.image || undefined}
        content={<p className={s.Description}>{comment?.text}</p>}
        datetime={moment(comment?.datetime).fromNow()}
      />
    </>
  )
}

export default Comment
