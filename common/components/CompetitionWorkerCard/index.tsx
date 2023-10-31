import React, { FC, useState } from 'react'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Form, Image, Alert } from 'antd'
import {
  useAddFeedbackMutation,
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../api/userApi/user.api'
import s from './style.module.scss'
import ModalNoFooter from '../UI/ModalNoFooter'
import EndTask from '../EndTask'
import AddFeedbackForm from '../Forms/AddFeedbackForm'
import { useSession } from 'next-auth/react'
import { IFeedback } from '../../modules/models/User'
import { TaskStatuses } from '../../../utils/constants'
import RateStars from '../UI/RateStars'
import Steper from '../UI/Steper'
// import ConfirmTask from '../Forms/ConfirmTask'

interface Props {
  _id: string | any
  taskCreatorId: string | any
  taskStatus: TaskStatuses | string
  // steps
}

const CompetitionWorkerCard: FC<Props> = ({
  _id,
  taskCreatorId,
  taskStatus,
}) => {
  const session = useSession()
  const { data: sessionUser } = useGetUserByEmailQuery(
    session?.data?.user?.email
  )

  const [addFeedback] = useAddFeedbackMutation()

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  const [form] = Form.useForm()
  const { data } = useGetUserByIdQuery(_id)
  const user = data?.data
  const desc = ['Жахливо', 'Погано', 'Нормально', 'Добре', 'Прекрасно']

  const Reset = () => {
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  const onCancelModal = () => {
    setIsModalVisible(false)
    Reset()
  }

  const onSubmitModal = async () => {
    if (sessionUser?.data?._id === user?._id) return Reset()

    const formData: IFeedback = await form.validateFields()

    setIsFormDisabled(true)
    await addFeedback({
      _id: user?._id,
      feedback: [
        {
          id: sessionUser?.data?._id as string,
          text: formData?.text,
          grade: formData?.grade,
        },
      ],
    })
    Reset()
  }

  return (
    <div className={s.container}>
      {
        <Card className={s.Card}>
          <Avatar
            className={s.Avatar}
            icon={<UserOutlined />}
            src={
              <Image
                src={
                  user?.image ||
                  'https://anime.anidub.life/templates/kinolife-blue/images/bump.png'
                }
                preview={false}
                style={{ width: 88 }}
                alt="UserImg"
              />
            }
          />
          <p>Ім&#x27;я: {user?.name || user?.email}</p>
          <p>Пошта: {user?.email}</p>
          <p>Телефон: {user?.tel}</p>
          <RateStars disabled defaultValue={user?.rating} />
          {sessionUser?.data?._id === user?._id ||
          sessionUser?.data?._id === taskCreatorId ? (
            <div className={s.btnGroup}>
              {taskStatus !== 'completed' ? (
                <Button
                  type="primary"
                  onClick={() => setIsModalVisible(!isModalVisible)}
                >
                  Завершити
                </Button>
              ) : (
                <p>Замовлення недоступне</p>
              )}
            </div>
          ) : null}
        </Card>
      }

      <ModalNoFooter
        title={`Завершити завдання з ${user?.name || user?.email}`}
        isModalVisible={isModalVisible}
        footer={null}
        onCancel={onCancelModal}
        // onOk={onSubmitModal}
        okText="Готово"
        cancelText="Cancel"
      >
        <Steper
          closeModal={Reset}
          onSubmitModal={onSubmitModal}
          steps={[
            {
              title: 'Перший крок',
              content: '',
            },
            {
              title: 'Другий крок',
              content: (
                <AddFeedbackForm isFormDisabled={isFormDisabled} form={form} />
              ),
            },
            {
              title: 'Третій крок',
              content: (
                <Alert
                  style={{ marginTop: '15px' }}
                  message="Успішно"
                  type="success"
                  showIcon
                />
              ),
            },
          ]}
        />
        {/* <AddFeedbackForm isFormDisabled={isFormDisabled} form={form} /> */}
      </ModalNoFooter>
    </div>
  )
}

export default CompetitionWorkerCard
