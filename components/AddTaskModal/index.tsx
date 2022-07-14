import { useJsApiLoader } from '@react-google-maps/api'
import { Modal, DatePicker, Form, Input, Select } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import { useGetAllCategoriesQuery } from '../../api/categoriesApi/category.api'
import { useAddTaskMutation } from '../../api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'
import { ITask } from '../../models/Task'
import Map from '../Map'
import { PlacesAutocomplete } from '../PlacesAutocomplete'
import s from './style.module.scss'

type FormData = {
  category?: string
  deadline: string
  desription?: string
  domain?: { any }
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

  const [libraries] = useState(['places'] as any)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const [form] = Form.useForm()

  const [addTask] = useAddTaskMutation()
  const { data: session } = useSession()
  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  const onSubmit = async () => {
    const formData: ITask = await form.validateFields()
    setFormDisabled(true)
    await addTask({ ...formData, creator: userData?.data?._id })
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

  const adresses = [
    { value: 'Burns Bay Road' },
    { value: 'Downing Street' },
    { value: 'Wall Street' },
  ]

  const [Pvalue, setPValue] = useState(null)

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
        <Form.Item rules={[{ required: true }]} name="domain" label="Adress">
          <PlacesAutocomplete isLoaded={isLoaded} />
          <Map
            isLoaded={isLoaded}
            center={{
              lat: 50.264915,
              lng: 28.661954,
            }}
          />
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
