import { Form, Radio } from 'antd'
import type { RadioChangeEvent } from 'antd'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  useGetUserByEmailQuery,
  useUpdateUserRoleMutation,
} from '../../../api/userApi/user.api'
import s from './style.module.scss'
import ModalWindow from '../ModalWindow/index'
import WorkerForm from '../../Forms/WorkerForm/index'
import { Roles } from '../../../../utils/constants'
import { IAddress } from '@common/modules/models/Task'

const RoleSwitcher: React.FC = () => {
  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const [updateUserRole, { isLoading: isUpdating }] =
    useUpdateUserRoleMutation()

  const user = data?.data

  const [form] = Form.useForm()

  const [role, setRole] = useState<string>(user?.role)
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [address, setAddress] = useState<IAddress>(null)

  useEffect(() => {
    setRole(user?.role)
  }, [user?.role])

  const onChange = async (e: RadioChangeEvent) => {
    if (!user?.isWorker) {
      if (e.target.value === Roles.WORKER) {
        setIsModalVisible(true)
      }
    } else {
      await updateUserRole({ email: user?.email, role: `${e.target.value}` })
    }
  }

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmitModal = async () => {
    let error = false
    if (!address || Object.keys(address).length <= 0) {
      setError(true)
      error = true
    } else setError(false)
    const formData = await form.validateFields()
    if (error !== true) {
      setIsFormDisabled(true)
      await updateUserRole({
        email: user?.email,
        tel: `+380${formData.tel}`,
        address,
      })

      form.resetFields()
      setIsModalVisible(false)
      setIsFormDisabled(false)
    }
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
      <div className={s.Worker}>
      <ModalWindow
        title="Переключити на роль майстра"
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmitModal}
        okText="Так"
        cancelText="Ні"
      >
        <WorkerForm
          isFormDisabled={isFormDisabled}
          form={form}
          user={user}
          setAddress={setAddress}
          address={address}
          isLoaded={Object.keys(user).length > 0 ?? false}
          error={error}
          setError={setError}
        />
      </ModalWindow>
      </div>
    </>
  )
}

export default RoleSwitcher
