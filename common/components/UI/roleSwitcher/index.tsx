import { Form, Radio } from 'antd'
import type { RadioChangeEvent } from 'antd'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  useGetUserByEmailQuery,
  useUpdateUserMutation,
} from '../../../api/userApi/user.api'
import s from './style.module.scss'
import ModalWindow from '../ModalWindow/index'
import WorkerForm from '../../Forms/WorkerForm/index'
import { Roles } from '../../../../utils/constants'

const RoleSwitcher: React.FC = () => {
  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  const user = data?.data

  const [form] = Form.useForm()

  const [role, setRole] = useState<string>(user?.role)
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  useEffect(() => {
    setRole(user?.role)
  }, [user?.role])

  const onChange = async (e: RadioChangeEvent) => {
    if (!user?.isWorker) {
      if (e.target.value === Roles.WORKER) {
        setIsModalVisible(true)
      }
    } else {
      await updateUser({ email: user?.email, role: `${e.target.value}` })
    }
  }

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmitModal = async () => {
    const formData = await form.validateFields()
    setIsFormDisabled(true)
    await updateUser({ email: user?.email, tel: `+380${formData.tel}` })
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  return (
    <>
      <Radio.Group
        className={s.RoleSwitcher}
        disabled={isUpdating}
        onChange={onChange}
        value={role}
        style={{ width: '100%' }}
        buttonStyle="solid"
      >
        <Radio.Button value="User">User</Radio.Button>
        <Radio.Button value="Worker">Worker</Radio.Button>
        <Radio.Button value="Admin">Admin</Radio.Button>
      </Radio.Group>
      <ModalWindow
        title="Update role to worker"
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmitModal}
        okText="Submit"
        cancelText="Cancel"
      >
        <WorkerForm isFormDisabled={isFormDisabled} form={form} />
      </ModalWindow>
    </>
  )
}

export default RoleSwitcher
