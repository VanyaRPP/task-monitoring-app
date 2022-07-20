import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Card, List, Button, Form } from 'antd'
import ModalWindow from 'common/components/UI/ModalWindow'
import AddCommentForm from 'common/components/AddCommentForm'
import Comment from './comment'
import { IComment } from '../../modules/models/Task'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import {
  useGetTaskByIdQuery,
  useAddCommentMutation,
} from 'common/api/taskApi/task.api'
import { useSession } from 'next-auth/react'
import s from './style.module.scss'

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

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  const [form] = Form.useForm()

  const [addComment] = useAddCommentMutation()

  const Reset = () => {
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  const onCancelModal = () => {
    Reset()
  }

  const onSubmiModal = async () => {
    const formData: IComment = await form.validateFields()

    setIsFormDisabled(true)
    await addComment({
      _id: task?.data?._id,
      comment: [
        {
          id: sessionUser?.data?._id,
          text: formData?.text,
        },
      ],
    })

    Reset()
  }

  return (
    <Card
      loading={loading}
      className={s.Card}
      title={
        <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          Comments
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          />
          <ModalWindow
            title={`Leave comment to ${task?.data?.name}`}
            isModalVisible={isModalVisible}
            onCancel={onCancelModal}
            onOk={onSubmiModal}
            okText="Leave comment"
            cancelText="Cancel"
          >
            <AddCommentForm isFormDisabled={isFormDisabled} form={form} />
          </ModalWindow>
        </span>
      }
    >
      <List
        className={s.List}
        dataSource={task?.data?.comment}
        renderItem={(item, index) => (
          <List.Item key={index}>
            <Comment comment={item} />
          </List.Item>
        )}
      />
    </Card>
  )
}

export default CommentsCard
