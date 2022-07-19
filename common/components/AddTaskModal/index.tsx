import { useJsApiLoader } from '@react-google-maps/api'
import { Modal, DatePicker, Form, Input, Select } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { centerTownGeoCode } from 'utils/constants'
import { useGetAllCategoriesQuery } from '../../api/categoriesApi/category.api'
import { useAddTaskMutation } from '../../api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'
import { IAddress } from '../../modules/models/Task'
import Map from '../Map'
import { PlacesAutocomplete } from '../PlacesAutocomplete'
import s from './style.module.scss'

type FormData = {
  category?: string
  deadline: string
  desription?: string
  domain?: { any }
  name: string
  creator?: string
  customer: string
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
  const [address, setAddress] = useState<IAddress>(null)
  const [error, setError] = useState<boolean>(false)

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

  const check = useCallback(() => {
    if (!address && Object.keys(address).length <= 0) {
      setError(true)
    } else setError(false)
  }, [address, setError])

  useEffect(() => {
    if (address) {
      check()
    }
  }, [address, check])

  const onSubmit = async () => {
    let error = false
    if (!address || Object.keys(address).length <= 0) {
      setError(true)
      error = true
    } else setError(false)
    const formData: FormData = await form.validateFields()
    if (error !== true) {
      setFormDisabled(true)
      await addTask({
        ...formData,
        address: address,
        creator: userData?.data?._id,
      })
      console.log(formData)

      form.resetFields()
      setIsModalVisible(false)
      setFormDisabled(false)
    }
  }

  const onCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < moment().startOf('day')
  }

  const mapOptions = useMemo(() => {
    return {
      geoCode: address ? address.geoCode : centerTownGeoCode,
      zoom: address ? 17 : 12,
    }
  }, [address])

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
        {userData?.data?.role == 'Admin' && (
          <Form.Item name="customer" label="Name of customer">
            <Input />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          label="Name of task"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="desription" label="Description">
          <Input.TextArea maxLength={250} />
        </Form.Item>
        <Form.Item name="domain" label="Address">
          <PlacesAutocomplete
            isLoaded={isLoaded}
            setAddress={setAddress}
            error={error}
            address={address?.name}
          />
          <div className={`${s.default} ${error ? '' : s.error}`}>
            Enter address, please!
          </div>
          <Map
            isLoaded={isLoaded}
            mapOptions={mapOptions}
            setAddress={setAddress}
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
