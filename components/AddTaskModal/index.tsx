import {
  Modal,
  DatePicker,
  Form,
  Input,
  Select,
  Radio,
  RadioChangeEvent,
} from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useGetAllCategoriesQuery } from '../../api/categoriesApi/category.api'
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
  const [domain, setDomain] = useState<string>('default')

  const [form] = Form.useForm()

  const [addTask] = useAddTaskMutation()
  const { data: session } = useSession()
  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = userData?.data
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

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

  const onChangeDomain = (e: RadioChangeEvent) => {
    setDomain(e.target.value)
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
          <Radio.Group onChange={onChangeDomain} value={domain}>
            <Radio value="default">Default domain</Radio>
            <Radio value="custom">Custom domain</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="category" label="Categories">
          <Select>
            {categories &&
              categories.map((category) => (
                <Select.Option key={category?._id} value={category?.name}>
                  {category?.name}
                </Select.Option>
              ))}
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
