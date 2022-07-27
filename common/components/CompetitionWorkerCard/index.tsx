import React, { FC, useState } from 'react'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Image, Rate } from 'antd'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import s from './style.module.scss'
import ModalWindow from '../UI/ModalWindow'

interface Props {
  _id: string | any
}

const CompetitionWorkerCard: FC<Props> = ({ _id }) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

  const { data } = useGetUserByIdQuery(_id)
  const user = data?.data
  const desc = ['Жахливо', 'Погано', 'Нормально', 'Добре', 'Прекрасно']

  const onCancelModal = () => {
    setIsModalVisible(false)
    // form.resetFields()
  }

  const onSubmiModal = async () => {
    // const formData = await form.validateFields()
    // const data = { ...formData, workerid: userData?.data?._id, taskId: taskId }
    // setIsFormDisabled(true)
    // addTaskExecutor(data)
    // form.resetFields()
    // setIsModalVisible(false)
    // setIsFormDisabled(false)
  }

  return (
    <div className={s.container}>
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
        <p>Ім`я: {user?.name || user?.email}</p>
        <p>Пошта: {user?.email}</p>
        <p>Телефон: {user?.tel}</p>
        <Rate disabled defaultValue={user?.rating} />
        <div className={s.btnGroup}>
          <Button
            type="primary"
            onClick={() => setIsModalVisible(!isModalVisible)}
          >
            Готово
          </Button>
        </div>
      </Card>
      <ModalWindow
        title={`Завершити завдання з ${user?.name || user?.email}`}
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmiModal}
        okText="Готово"
        cancelText="Cancel"
      >

      </ModalWindow>
    </div>
  )
}

export default CompetitionWorkerCard
