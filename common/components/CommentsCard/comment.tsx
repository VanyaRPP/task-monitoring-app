import { Comment as CommentAntd } from '@ant-design/compatible'
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
    <>
      <CommentAntd
        className={classNames(s.Comment, {
          [s.Active]: sessionUser?.data?._id === user?._id,
        })}
        author={user ? <UserLink user={user} /> : 'Власника не знайдено'}
        avatar={user?.image || undefined}
        content={<p className={s.Description}>{comment?.text}</p>}
        // datetime={dayjs(comment?.datetime).fromNow()}
      />
    </>
  )
}

export default Comment
