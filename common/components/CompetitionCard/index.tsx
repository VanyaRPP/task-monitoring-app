import { useState } from 'react'
import { Card, notification, Table, Button, Form, Avatar } from 'antd'
import ModalWindow from '../UI/ModalWindow/index'
import ApplyAuctionForm from '../ApplyAuctionForm/index'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../api/userApi/user.api'
import Column from 'antd/lib/table/Column'
import { ITask, ItaskExecutors } from '../../modules/models/Task'
import Meta from 'antd/lib/card/Meta'
import { useAddTaskExecutorMutation } from 'common/api/taskApi/task.api'
import { useSession } from 'next-auth/react'
import s from './style.module.scss'

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

const CompetitionCard: React.FC<{
  task: ITask
}> = ({ task }) => {
  const executors = task?.taskexecutors.map((executor) => ({
    ...executor,
    key: executor.workerid,
  }))

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

  const onSubmitModal = async () => {
    const formData = await form.validateFields()
    const data = {
      ...formData,
      workerid: userData?.data?._id,
      taskId: task?._id,
    }
    setIsFormDisabled(true)
    addTaskExecutor(data)
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  const onApplyCompetition = () => {
    if (
      task?.taskexecutors.every(
        (executor) => executor.workerid !== userData?.data?._id
      )
    ) {
      setIsModalVisible(true)
    } else {
      notification.info({
        message: 'You already apply for this task',
        placement: 'topRight',
      })
    }
  }

  return (
    <Card
      className={s.Card}
      title={`Competition: ${task?.taskexecutors ? task?.taskexecutors.length : ''
        }`}
      extra={
        task?.creator !== userData?.data?._id && (
          <Button type="primary" ghost onClick={onApplyCompetition}>
            Apply
          </Button>
        )
      }
    >
      <ModalWindow
        title="Apply for an competition"
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmitModal}
        okText="Apply"
        cancelText="Cancel"
      >
        <ApplyAuctionForm isFormDisabled={isFormDisabled} form={form} />
      </ModalWindow>
      <Table key="competition" dataSource={executors} pagination={false}>
        <Column
          title="Executors"
          dataIndex="workerid"
          key="executors"
          width="55%"
          render={(_, executor: ItaskExecutors) => (
            <Executor executor={executor} type="workerInfo" />
          )}
        />
        <Column title="Price" dataIndex="price" key="price" width="15%" />
        <Column
          title="Rating"
          dataIndex="rating"
          key="rating"
          width="15%"
          render={(_, executor: ItaskExecutors) => (
            <Executor executor={executor} type="rating" />
          )}
        />
        {
          task?.creator === userData?.data?._id && (
            <Column
              title="Actions"
              key="actions"
              width="15%"
              render={() => (
                <Button type="primary" ghost>
                  Submit worker
                </Button>
              )}
            />
          )
        }
      </Table>
    </Card>
  )
}

export default CompetitionCard
