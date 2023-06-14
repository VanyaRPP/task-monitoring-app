import { useJsApiLoader } from '@react-google-maps/api'
import { Modal, DatePicker, Form, Input, Select, Tooltip } from 'antd'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { centerTownGeoCode, Roles } from 'utils/constants'
import {
  deleteExtraWhitespace,
  validateField,
} from '../../assets/features/validators'
import Map from '../Map'
import { PlacesAutocomplete } from '../PlacesAutocomplete'
import CustomTooltip from '../UI/CustomTooltip'
import s from './style.module.scss'
import { disabledDate } from '../../assets/features/formatDate'
import { useGetAllCategoriesQuery } from '@common/api/categoriesApi/category.api'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { useAddTaskMutation } from '@common/api/taskApi/task.api'
import { IAddress } from '@common/modules/models/Task'

type FormData = {
  category?: string
  deadline: string
  description?: string
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

      form.resetFields()
      setIsModalVisible(false)
      setFormDisabled(false)
    }
  }

  const onCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const mapOptions = useMemo(() => {
    return {
      geoCode: address ? address.geoCode : centerTownGeoCode,
      zoom: address ? 17 : 12,
    }
  }, [address])

  return (
    <Modal
      maskClosable={false}
      open={isModalVisible}
      title="Створити завдання"
      okText="Створити"
      cancelText="Скасувати"
      onCancel={onCancel}
      onOk={onSubmit}
      className={s.Modal}
    >
      <Form
        id="addTaskForm"
        style={{ position: 'relative' }}
        form={form}
        layout="vertical"
        name="form_in_modal"
        disabled={formDisabled}
      >
        {userData?.data?.roles?.includes(Roles.GLOBAL_ADMIN) && (
          <Form.Item
            name="customer"
            label="Ім'я замовника"
            normalize={deleteExtraWhitespace}
            rules={validateField('name')}
          >
            <Input />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          normalize={deleteExtraWhitespace}
          rules={validateField('name')}
          label="Назва завдання"
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Опис">
          <Input.TextArea maxLength={250} />
        </Form.Item>
        {/* Waiting for backend !!! */}

        {/* <Form.Item name="images">
          <UploadImages />
        </Form.Item> */}
        <Form.Item name="domain" label="Адреса">
          <PlacesAutocomplete
            isLoaded={isLoaded}
            setAddress={setAddress}
            error={error}
            addressObj={address}
          />
          <div className={`${s.default} ${error ? '' : s.error}`}>
            Введіть свою адресу, будь ласка!
          </div>
          <Map
            isLoaded={isLoaded}
            mapOptions={mapOptions}
            setAddress={setAddress}
          />
        </Form.Item>
        <Form.Item name="category" label="Категорії">
          <Select
            getPopupContainer={() => document.getElementById('addTaskForm')}
          >
            {categories &&
              categories.map((category) => (
                <Select.Option key={category?._id} value={category?.name}>
                  <Tooltip placement="top" title={category?.description}>
                    {category?.name}
                  </Tooltip>
                </Select.Option>
              ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="deadline"
          label={
            <CustomTooltip
              title="Коли ви очікуєте виконання роботи"
              text="Виконати до"
              placement="topLeft"
            />
          }
          rules={validateField('deadline')}
        >
          <DatePicker
            getPopupContainer={() => document.getElementById('addTaskForm')}
            disabledDate={disabledDate}
            placeholder="Оберіть дату"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddTaskModal
