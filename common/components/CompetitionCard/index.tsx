import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Card,
  notification,
  Table,
  Button,
  Form,
  Avatar,
  Popconfirm,
} from 'antd'
import Column from 'antd/lib/table/Column'
import Meta from 'antd/lib/card/Meta'
import ModalWindow from '../UI/ModalWindow/index'
import { ITask, ITaskExecutors } from 'common/modules/models/Task'
import CompetitionForm from '../Forms/CompetitionForm/index'
import {
  useAcceptWorkerMutation,
  useAddTaskExecutorMutation,
} from 'common/api/taskApi/task.api'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../api/userApi/user.api'
import s from './style.module.scss'
import { QuestionCircleOutlined } from '@ant-design/icons'
import UserLink from '../UserLink'
import CompetitionWorkerCard from '../CompetitionWorkerCard'

export const Executor = ({ executor, type }) => {
  const { data } = useGetUserByIdQuery(`${executor.workerid}`)
  const worker = data?.data

  if (type === 'workerInfo') {
    return (
      <Meta
        avatar={<Avatar src={worker?.image} />}
        title={
          <span style={{ color: 'var(--textColor)' }}>
            <UserLink user={worker} />
          </span>
        }
        description={
          <span style={{ color: 'var(--textColor)', opacity: 0.5 }}>
            {executor.description}
          </span>
        }
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
  const [acceptWorker] = useAcceptWorkerMutation()

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
        message: 'Ви вже подали заявку на це завдання',
        placement: 'topRight',
      })
    }
  }

  const onApprove = (executor) => {
    acceptWorker({ taskId: executor.taskId, workerId: executor.workerid })
  }

  return (
    <Card
      className={s.Card}
      title={`Список майстрів: ${
        task?.taskexecutors ? task?.taskexecutors.length : ''
      }`}
      extra={
        task?.creator !== userData?.data?._id && (
          <Button
            type="primary"
            ghost
            onClick={onApplyCompetition}
            disabled={
              !task?.taskexecutors.every(
                (executor) => executor.workerid !== userData?.data?._id
              )
            }
          >
            Подати заявку
          </Button>
        )
      }
    >
      {task?.executant ? <CompetitionWorkerCard _id={task?.executant} /> : null}
      <ModalWindow
        title="Подати заявку"
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmitModal}
        okText="Додати"
        cancelText="Скасувати"
      >
        <CompetitionForm isFormDisabled={isFormDisabled} form={form} />
      </ModalWindow>
      <Table key="competition" dataSource={executors} pagination={false}>
        <Column
          title="Майстри"
          dataIndex="workerid"
          key="executors"
          width="55%"
          render={(_, executor: ITaskExecutors) => (
            <Executor executor={executor} type="workerInfo" />
          )}
        />
        <Column
          title="Ціна"
          dataIndex="price"
          key="price"
          width="15%"
          render={(price) => <div>{price} ₴</div>}
        />
        <Column
          title="Рейтинг"
          dataIndex="rating"
          key="rating"
          width="15%"
          render={(_, executor: ITaskExecutors) => (
            <Executor executor={executor} type="rating" />
          )}
        />
        {task?.creator === userData?.data?._id && (
          <Column
            title="Обрати майстра"
            key="actions"
            width="10%"
            render={(_, executor: ITaskExecutors) => (
              <Popconfirm
                title="Ви впевнені?"
                okText="Так"
                cancelText="Ні"
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                onConfirm={() => onApprove(executor)}
              >
                <Button type="primary" ghost>
                  Обрати
                </Button>
              </Popconfirm>
            )}
          />
        )}
      </Table>
    </Card>
  )
}

export default CompetitionCard
