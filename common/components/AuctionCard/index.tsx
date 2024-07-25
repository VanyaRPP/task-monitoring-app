import { Avatar, Button, Card, Empty, Form, Table } from 'antd'
import { useState } from 'react'
import s from './style.module.scss'

import { useAddTaskExecutorMutation } from '@common/api/taskApi/task.api'
import Modal from '@components/UI/ModalWindow'
import { ITaskExecutors } from '@modules/models/Task'
import Meta from 'antd/lib/card/Meta'
import Column from 'antd/lib/table/Column'
import { useSession } from 'next-auth/react'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../api/userApi/user.api'
import ApplyAuctionForm from '../ApplyAuctionForm/index'

export const Executor = ({ executor, type }) => {
  const { data: worker } = useGetUserByIdQuery(`${executor.workerid}`)

  if (type === 'workerInfo') {
    return (
      <Meta
        avatar={<Avatar src={worker?.image} />}
        title={worker?.name}
        description={<p>{executor.description}</p>}
      />
    )
  }

  if (type === 'rating') {
    return <div>{worker?.rating}</div>
  }
}

const AuctionCard = ({ taskId, taskExecutors }) => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)

  const { data: session } = useSession()
  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)

  const [addTaskExecutor] = useAddTaskExecutorMutation()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmiModal = async () => {
    const formData = await form.validateFields()
    const data = { ...formData, workerid: userData?.data?._id, taskId: taskId }
    setIsFormDisabled(true)
    addTaskExecutor(data)
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  return (
    <Card
      className={s.Card}
      title={`Пропозиції: ${taskExecutors ? taskExecutors.length : ''}`}
      extra={
        <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
          Подати заявку
        </Button>
      }
    >
      <Modal
        title="Подати заявку в пропозиції"
        open={isModalVisible}
        onCancel={onCancelModal}
        changed={() => isValueChanged}
        onOk={onSubmiModal}
        okText="Подати заявку"
        cancelText="Скасувати"
      >
        <ApplyAuctionForm
          isFormDisabled={isFormDisabled}
          form={form}
          setIsValueChanged={setIsValueChanged}
        />
      </Modal>
      {taskExecutors && taskExecutors.length !== 0 ? (
        <Table dataSource={taskExecutors} pagination={false}>
          <Column
            title="Список майстрів"
            dataIndex="workerid"
            key="executors"
            width="70%"
            render={(_, executor: ITaskExecutors) => (
              <Executor executor={executor} type="workerInfo" />
            )}
          />
          <Column title="Ціни" dataIndex="price" key="price" width="15%" />
          <Column
            title="Рейтинг"
            dataIndex="rating"
            key="rating"
            width="15%"
            render={(_, executor: ITaskExecutors) => (
              <Executor executor={executor} type="rating" />
            )}
          />
        </Table>
      ) : (
        <Empty description="Немає даних" className={s.Empty} />
      )}
    </Card>
  )
}

export default AuctionCard
