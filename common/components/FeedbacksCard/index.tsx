import { PlusOutlined } from '@ant-design/icons'
import {
  useAddFeedbackMutation,
  useGetUserByEmailQuery,
} from '@common/api/userApi/user.api'
import AddFeedbackForm from '@components/Forms/AddFeedbackForm'
import Modal from '@components/UI/ModalWindow'
import { IFeedback, IUser } from '@modules/models/User'
import { Button, Card, Empty, Form, List, Rate } from 'antd'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Feedback from './feedback'
import s from './style.module.scss'

// const RateDescription = ['Terrible', 'Bad', 'Normal', 'Good', 'Wonderful']
const RateDescription = ['Жахливо', 'Погано', 'Нормально', 'Добре', 'Прекрасно']

interface Props {
  user: IUser
  loading?: boolean
  userRate: number
}

// function CalculateAVG(feedback) {
//   return (
//     Math.floor(
//       (feedback?.length > 0
//         ? feedback?.reduce((a, b) => a + b.rate, 0) / feedback?.length
//         : 3.5) * 2
//     ) / 2
//   )
// }

const FeedbacksCard: React.FC<Props> = ({
  user,
  loading = false,
  userRate,
}) => {
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

  const onSubmitModal = async () => {
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
          id: sessionUser?.data?._id as string,
          text: formData?.text,
          grade: formData?.grade ?? 1,
        },
      ],
    })

    Reset()
  }

  // CalculateAVG(feedbacks)

  return (
    <Card
      loading={loading}
      className={s.Card}
      title={
        <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          Відгуки
          {sessionUser?.data?._id !== user?._id && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            />
          )}
          <Modal
            title={`Залиште відгук про ${user?.name}`}
            open={isModalVisible}
            changesForm={() => form.isFieldsTouched()}
            onCancel={onCancelModal}
            onOk={onSubmitModal}
            okText="Залишити відгук"
            cancelText="Скасувати"
          >
            <AddFeedbackForm isFormDisabled={isFormDisabled} form={form} />
          </Modal>
        </span>
      }
      extra={<Rate tooltips={RateDescription} disabled value={userRate} />}
    >
      {user?.feedback?.length ? (
        <List
          // ref={bottomRef}
          className={s.List}
          dataSource={user?.feedback}
          renderItem={(item, index) => (
            <List.Item key={index} className={s.ListItem}>
              <Feedback feedback={item} />
            </List.Item>
          )}
        />
      ) : (
        <Empty className={s.Empty} description="Немає даних" />
      )}
    </Card>
  )
}

export default FeedbacksCard
