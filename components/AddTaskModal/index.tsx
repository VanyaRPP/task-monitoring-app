import { Modal, DatePicker, Form, Input, Select } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useAddTaskMutation } from '../../api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'

type FormData = {
  category?: string
  deadline: string
  desription?: string
  domain?: string
  name: string
}

type PropsType = {
  isModalVisible: boolean
  setIsModalVisible: (isModalVisible: boolean) => void
}

const AddTaskModal: React.FC<PropsType> = ({
  isModalVisible,
  setIsModalVisible,
}) => {
  const [formDisabled, setFormDisabled] = useState<boolean>(false)

  const [form] = Form.useForm()

  const [addTask] = useAddTaskMutation()
  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  const onSubmit = async () => {
    const formData: FormData = await form.validateFields()
    setFormDisabled(true)
    await addTask({ ...formData, creator: user?._id })
    form.resetFields()
    setIsModalVisible(false)
    setFormDisabled(false)
  }

  const onCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < moment().startOf('day')
  }

  return (
    <Modal
      visible={isModalVisible}
      title="Add task"
      okText="Create task"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        disabled={formDisabled}
      >
        <Form.Item
          name="name"
          label="Name of task"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="desription" label="Description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="domain" label="Domain">
          <Select>
            <Select.Option value="domain 1">Domain 1</Select.Option>
            <Select.Option value="domain 2">Domain 2</Select.Option>
            <Select.Option value="domain 3">Domain 3</Select.Option>
            <Select.Option value="domain 4">Domain 4</Select.Option>
            <Select.Option value="domain 5">Domain 5</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="category" label="Categories">
          <Select>
            <Select.Option value="category 1">Category 1</Select.Option>
            <Select.Option value="category 2">Category 2</Select.Option>
            <Select.Option value="category 3">Category 3</Select.Option>
            <Select.Option value="category 4">Category 4</Select.Option>
            <Select.Option value="category 5">Category 5</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="deadline"
          label="Deadline"
          rules={[{ required: true }]}
        >
          <DatePicker disabledDate={disabledDate} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddTaskModal
