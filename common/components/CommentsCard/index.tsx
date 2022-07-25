import { useState } from 'react'
import { SendOutlined } from '@ant-design/icons'
import { Card, List, Button, Input, Avatar } from 'antd'
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
          id: sessionUser?.data?._id,
          text: input,
          datetime: new Date(),
        },
      ],
    })
    setInput('')
  }

  return (
    <Card loading={loading} className={s.Card} title="Коментарі">
      <List
        className={s.List}
        dataSource={task?.data?.comment}
        renderItem={(item, index) => (
          <List.Item key={index}>
            <Comment comment={item} taskId={task?.data?._id} />
          </List.Item>
        )}
      />

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
    </Card>
  )
}

export default CommentsCard
