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
import WorkerForm from '../../WorkerForm/index'

const RoleSwither: React.FC = () => {
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
      if (e.target.value === 'Worker') {
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
    // await addCategory({ ...formData })
    await updateUser({ email: user?.email, ...formData })
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
        <Radio.Button value="User">Замовник</Radio.Button>
        <Radio.Button value="Worker">Майстер</Radio.Button>
        <Radio.Button value="Admin">Адмін</Radio.Button>
      </Radio.Group>
      <ModalWindow
        title="Переключити на роль майстра"
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmitModal}
        okText="Так"
        cancelText="Ні"
      >
        <WorkerForm isFormDisabled={isFormDisabled} form={form} />
      </ModalWindow>
    </>
  )
}

export default RoleSwither
