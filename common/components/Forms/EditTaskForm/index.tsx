import { useJsApiLoader } from '@react-google-maps/api'
import { DatePicker, Form, Input, Select, Tooltip } from 'antd'
import { IAddress, ITask } from 'common/modules/models/Task'
import { useSession } from 'next-auth/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { centerTownGeoCode, Roles } from '../../../../utils/constants'
import { useGetAllCategoriesQuery } from '../../../api/categoriesApi/category.api'
import { useGetUserByEmailQuery } from '../../../api/userApi/user.api'
import { disabledDate } from '../../../assets/features/formatDate'
import {
  deleteExtraWhitespace,
  validateField,
} from '../../../assets/features/validators'
import { PlacesAutocomplete } from '../../PlacesAutocomplete'
import CustomTooltip from '../../UI/CustomTooltip'
import Map from 'common/components/Map'
import s from 'common/components/AddTaskModal/style.module.scss'
import moment from 'moment'

import { getModifiedObjectOfFormInstance } from '../../../../utils/helpers'

type PropsType = {
  formDisabled: boolean
  defaultTask: ITask
  form: any
}

const EditTaskForm: React.FC<PropsType> = ({
  defaultTask,
  formDisabled,
  form,
}) => {
  const { data: session } = useSession()
  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  const [libraries] = useState(['places'] as any)

  const [address, setAddress] = useState<IAddress>(defaultTask?.address)
  const [error, setError] = useState<boolean>(false)
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  })

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

  const mapOptions = useMemo(() => {
    return {
      geoCode: address ? address.geoCode : centerTownGeoCode,
      zoom: address ? 17 : 12,
    }
  }, [address])

  return (
    <Form
      id="editTaskForm"
      style={{ position: 'relative' }}
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={formDisabled}
    >
      {userData?.data?.role == Roles.ADMIN && (
        <Form.Item
          name="customer"
          label="Ім'я замовника"
          normalize={deleteExtraWhitespace}
          rules={validateField('name')}
          initialValue={defaultTask?.customer}
        >
          <Input />
        </Form.Item>
      )}
      <Form.Item
        name="name"
        label="Назва завдання"
        normalize={deleteExtraWhitespace}
        rules={validateField('name')}
        initialValue={defaultTask?.name}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        initialValue={defaultTask?.description}
      >
        <Input.TextArea maxLength={250} />
      </Form.Item>
      {/* Waiting for backend !!! */}

      {/* <Form.Item name="images">
    <UploadImages />
  </Form.Item> */}
      <Form.Item
        name="address"
        label="Адреса"
        initialValue={defaultTask?.address}
      >
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
      <Form.Item
        name="category"
        label="Категорії"
        initialValue={defaultTask?.category}
      >
        <Select
          getPopupContainer={() => document.getElementById('editTaskForm')}
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
        initialValue={moment(defaultTask?.deadline)}
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
          getPopupContainer={() => document.getElementById('editTaskForm')}
          disabledDate={disabledDate}
          placeholder="Оберіть дату"
        />
      </Form.Item>
    </Form>
  )
}

export default EditTaskForm
