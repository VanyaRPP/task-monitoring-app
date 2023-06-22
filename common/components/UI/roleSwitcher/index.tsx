import { Form, Radio, Checkbox } from 'antd'
import type { RadioChangeEvent } from 'antd'
import { useEffect, useState } from 'react'
import {
  useGetCurrentUserQuery,
  useUpdateUserRoleMutation,
} from '../../../api/userApi/user.api'
import s from './style.module.scss'
import ModalWindow from '../ModalWindow/index'
import WorkerForm from '../../Forms/WorkerForm/index'
import { Roles } from '../../../../utils/constants'
import { IAddress } from '@common/modules/models/Task'

// TODO: REMOVE AT PROD !!!
const RoleSwitcher: React.FC = () => {
  const { data: user } = useGetCurrentUserQuery()
  const [updateUserRole, { isLoading: isUpdating }] =
    useUpdateUserRoleMutation()

  //const [form] = Form.useForm()

  const [roles, setRoles] = useState<string[]>(user?.roles)
  /*const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [address, setAddress] = useState<IAddress>(null)*/

  const adminRoles = [Roles.GLOBAL_ADMIN, Roles.DOMAIN_ADMIN]

  /*const onChange = async (e: RadioChangeEvent) => {
    if (!user?.isWorker) {
      if (e.target.value === Roles.WORKER) {
        setIsModalVisible(true)
      }
    } else {
      await updateUserRole({ email: user?.email, roles: [`${e.target.value}`] })
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
  }*/

  return (
    <>
      <Radio.Group
        className={s.RoleSwitcher}
        disabled={isUpdating}
        style={{ width: '100%' }}
        buttonStyle="solid"
        value={
          adminRoles.some((item) => roles.includes(item))
            ? adminRoles
            : roles[0]
        }
      >
        <Radio.Button value={Roles.USER}>Замовник</Radio.Button>
        <Radio.Button value={Roles.WORKER}>Майстер</Radio.Button>
        <Radio.Button value={adminRoles}>Адмін</Radio.Button>
      </Radio.Group>
      {/*<div className={s.Worker}>
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
      </div>*/}
    </>
  )
}

export default RoleSwitcher
