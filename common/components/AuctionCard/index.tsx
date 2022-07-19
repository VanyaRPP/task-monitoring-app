import { useState } from 'react'
import { Card, Table, Button, Form, Avatar } from 'antd'
import s from './style.module.scss'

import ModalWindow from '../UI/ModalWindow/index'
import ApplyAuctionForm from '../ApplyAuctionForm/index'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../api/userApi/user.api'
import Column from 'antd/lib/table/Column'
import { ItaskExecutors } from '../../modules/models/Task'
import Meta from 'antd/lib/card/Meta'
import { useAddTaskExecutorMutation } from 'common/api/taskApi/task.api'
import { useSession } from 'next-auth/react'

export const Executor = ({ executor, type }) => {
  const { data } = useGetUserByIdQuery(`${executor.workerid}`)
  const worker = data?.data

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
      title={`Auction: ${taskExecutors ? taskExecutors.length : ''}`}
      extra={
        <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
          Apply
        </Button>
      }
    >
      <ModalWindow
        title="Apply for an auction"
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmiModal}
        okText="Apply"
        cancelText="Cancel"
      >
        <ApplyAuctionForm isFormDisabled={isFormDisabled} form={form} />
      </ModalWindow>
      <Table dataSource={taskExecutors} pagination={false}>
        <Column
          title="Executors"
          dataIndex="workerid"
          key="executors"
          width="70%"
          render={(_, executor: ItaskExecutors) => (
            <Executor executor={executor} type="workerInfo" />
          )}
        />
        <Column
          title="Price"
          dataIndex="price"
          key="price"
          width="15%"
          sorter={(a, b) => a.price - b.price}
        />
        <Column
          title="Rating"
          dataIndex="rating"
          key="rating"
          width="15%"
          render={(_, executor: ItaskExecutors) => (
            <Executor executor={executor} type="rating" />
          )}
        />
      </Table>
    </Card>
  )
}

export default AuctionCard
