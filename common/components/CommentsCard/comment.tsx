import { Comment as CommentAntd, Tooltip } from 'antd'
import { useGetUserByIdQuery } from 'common/api/userApi/user.api'
import {
  DislikeFilled,
  DislikeOutlined,
  LikeFilled,
  LikeOutlined,
} from '@ant-design/icons'
import { IComment } from 'common/modules/models/Task'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import classNames from 'classnames'
import moment from 'moment'
import s from './style.module.scss'

const Comment: React.FC<{ comment: IComment; taskId: string }> = ({
  comment,
  taskId,
}) => {
  const session = useSession()
  const { data: sessionUser } = useGetUserByEmailQuery(
    session?.data?.user?.email
  )

  const { data } = useGetUserByIdQuery(comment.id)
  const user = data?.data

  const like = () => {
    // TODO: Back-End to patch likes (if needed)
  }

  const dislike = () => {
    // TODO: Back-End to patch dislikes (if needed)
  }

  const actions = [
    <Tooltip key="comment-basic-like" title="Like">
      <span className={s.Tooltip} onClick={like}>
        {comment?.like?.includes(sessionUser?.data?._id) ? (
          <LikeFilled className={classNames(s.Like, s.Own)} />
        ) : (
          <LikeOutlined className={s.Like} />
        )}
        <span>{comment?.like?.length}</span>
      </span>
    </Tooltip>,
    <Tooltip key="comment-basic-dislike" title="Dislike">
      <span className={s.Tooltip} onClick={dislike}>
        {comment?.dislike?.includes(sessionUser?.data?._id) ? (
          <DislikeFilled className={classNames(s.Dislike, s.Own)} />
        ) : (
          <DislikeOutlined className={s.Dislike} />
        )}
        <span>{comment?.dislike?.length}</span>
      </span>
    </Tooltip>,
  ]

  return (
    <>
      <CommentAntd
        className={classNames(s.Comment, {
          [s.Active]: sessionUser?.data?._id === user?._id,
        })}
        actions={actions}
        author={user ? user?.name : 'User not found'}
        avatar={user?.image || undefined}
        content={<p className={s.Description}>{comment?.text}</p>}
        datetime={moment(comment?.datetime).fromNow()}
      />
    </>
  )
}

export default Comment
