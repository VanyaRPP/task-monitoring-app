import { useEffect, useRef, useState } from 'react'
import { SendOutlined } from '@ant-design/icons'
import { Card, List, Button, Input, Empty } from 'antd'
import Comment from './comment'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import {
  useGetTaskByIdQuery,
  useAddCommentMutation,
} from 'common/api/taskApi/task.api'
import { useSession } from 'next-auth/react'
import s from './style.module.scss'
import { deleteExtraWhitespace } from '../../assets/features/validators'

interface Props {
  taskId: any
  loading?: boolean
}

const CommentsCard: React.FC<Props> = ({ taskId, loading = false }) => {
  const session = useSession()
  const { data: sessionUser } = useGetUserByEmailQuery(
    session?.data?.user?.email
  )

  const { data: task } = useGetTaskByIdQuery(taskId, {
    skip: !taskId,
  })

  const [addComment] = useAddCommentMutation()
  const [input, setInput] = useState<string>('')

  const handleAddTask = async () => {
    if (!input.trim()) return

    await addComment({
      _id: task?.data?._id,
      comment: [
        {
          id: sessionUser?.data?._id as string,
          text: input,
          datetime: new Date(),
        },
      ],
    })
    setInput('')
  }

  const bottomRef = useRef(null)
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView()
  // }, [task])

  // useEffect(() => {
  //   window.scrollTo(0, 0)
  // }, [])

  return (
    <div className={s.CardDiv}>
      <Card loading={loading} className={s.Card} title="Коментарі">
        {!loading ? (
          <List
            className={s.List}
            dataSource={task?.data?.comment}
            renderItem={(item, index) => (
              <List.Item key={index} ref={bottomRef}>
                <Comment comment={item} taskId={task?.data?._id} />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Немає даних" className={s.Empty} />
        )}
      </Card>
      <div className={s.Input}>
        <Input
          maxLength={250}
          placeholder="Введіть свій коментар..."
          value={deleteExtraWhitespace(input)}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleAddTask}
        />
        <Button
          type="primary"
          onClick={handleAddTask}
          icon={<SendOutlined />}
        />
      </div>
    </div>
  )
}

export default CommentsCard
