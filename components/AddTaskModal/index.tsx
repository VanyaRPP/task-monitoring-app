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
import Gmap from '../Gmap'
import GoogleAutocomplete, { PlacesAutocomplete } from '../GMAutoCompleteField'
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

  const [place, setPlace] = useState({})

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

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < moment().startOf('day')
  }

  const adresses = [
    { value: 'Burns Bay Road' },
    { value: 'Downing Street' },
    { value: 'Wall Street' },
  ]

  // const { ref } = usePlacesWidget({
  //   apiKey: 'AIzaSyCrLYvKmksLWFJc17LLPTmfFDkacN4l0To',
  //   options: { types: ["address"] },
  //   onPlaceSelected: (place) => console.log(place)
  // })
  const [Pvalue, setPValue] = useState(null);

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
          {/* <Autocomplete
            className={s.AntDinputAutocomplete}
            apiKey={'AIzaSyCrLYvKmksLWFJc17LLPTmfFDkacN4l0To'}
            style={{ width: "100%", zIndex: "100" }}
            options={{
              types: ["address"],
            }}
          // defaultValue="Amsterdam"

          />
          <Autocomplete
            apiKey={'AIzaSyCrLYvKmksLWFJc17LLPTmfFDkacN4l0To'}
            // className={s.AntDinputAutocomplete}
            style={{ width: "100%", zIndex: "100" }}
            options={{
              types: ["address"],
            }}
            onPlaceSelected={(place) => console.log(place.geometry.location)}
          /> */}
          {/* <GooglePlacesAutocomplete
            apiKey="AIzaSyCrLYvKmksLWFJc17LLPTmfFDkacN4l0To"
            selectProps={{
              isClearable: true,
              // value: address,
              onChange: (val) => {
                console.log(val);
              }
            }}
          /> */}
          <PlacesAutocomplete />
          <Gmap place={place} />
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
