import { Empty,   Card, List, Button, Form } from 'antd'
import { useState } from 'react'
import { StarOutlined, PlusOutlined } from '@ant-design/icons'
import { IFeedback, IUser } from 'common/modules/models/User'
import ModalWindow from 'common/components/UI/ModalWindow'
import AddFeedbackForm from 'common/components/AddFeedbackForm'
import Feedback from './feedback'
import {
  useGetUserByEmailQuery,
  useAddFeedbackMutation,
} from 'common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import s from './style.module.scss'

interface Props {
  user: IUser
  loading?: boolean
}

function CalculateAVG(feedback) {
  return (
    Math.floor(
      (feedback?.length > 0
        ? feedback?.reduce((a, b) => a + b.grade, 0) / feedback?.length
        : 0) * 100
    ) / 100
  )
}

const FeedbacksCard: React.FC<Props> = ({ user, loading = false }) => {
  const session = useSession()
  const { data: sessionUser } = useGetUserByEmailQuery(
    session?.data?.user?.email
  )
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  const [form] = Form.useForm()

  const [addFeedback] = useAddFeedbackMutation()

  const Reset = () => {
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  const onCancelModal = () => {
    Reset()
  }

  const onSubmiModal = async () => {
    // user can't leave feedback to himself
    if (sessionUser?.data?._id === user?._id) return Reset()

    // TODO: user can't leave feedback twice to single worker for same task
    // if () return Reset()

    const formData: IFeedback = await form.validateFields()

    setIsFormDisabled(true)
    await addFeedback({
      _id: user?._id,
      feedback: [
        {
          id: sessionUser?.data?._id,
          text: formData?.text,
          grade: formData?.grade,
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
          Feedbacks
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          />
          <ModalWindow
            title={`Leave feedback about ${user?.name}`}
            isModalVisible={isModalVisible}
            onCancel={onCancelModal}
            onOk={onSubmiModal}
            okText="Leave feedback"
            cancelText="Cancel"
          >
            <AddFeedbackForm isFormDisabled={isFormDisabled} form={form} />
          </ModalWindow>
        </span>
      }
      extra={
        <span style={{ color: 'var(--textColor)' }}>
          {`Rating: ${CalculateAVG(user?.feedback)} / 5 `}
          <StarOutlined />
        </span>
      }
    >
      {user?.feedback.length ? (
        <List
          className={s.List}
          dataSource={user?.feedback}
          renderItem={(item, index) => (
            <List.Item key={index}>
              <Feedback feedback={item} />
            </List.Item>
          )}
        />
      ) : (
        <Empty className={s.Empty} />
      )}
    </Card>
  )
}

export default FeedbacksCard
