import { useState } from 'react'
import { Form, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ModalWindow from '../../UI/ModalWindow'
import AddDomainModal from '../../Forms/AddDomainForm'
import s from './style.module.scss'
import { getModifiedObjectOfFormInstance } from '../../../../utils/helpers'
import { useAddDomainMutation } from '../../../api/domainApi/domain.api'
import { IDomain } from '../../../modules/models/Domain'

const AdminPageDomains: React.FC = () => {
  const [waypoints, setWaypoints] = useState([])
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const [addDomain] = useAddDomainMutation()

  const [form] = Form.useForm()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmitModal = async () => {
    form.setFieldsValue(
      getModifiedObjectOfFormInstance(form, [
        { name: 'area', value: waypoints },
      ])
    )
    const formData: IDomain = await form.validateFields()
    setIsFormDisabled(true)

    const stringStreets: string[] = waypoints.map((street) => street.toString())

    await addDomain({ ...formData, streets: stringStreets })

    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  return (
    <div className={s.Container}>
      {/* <List 
    className={s.List}
    dataSource={domains}
    renderItem={(item) => (
      <List.Item
        key={item._id}
        onClick={() => setUser(item)}
        className={`${s.ListItem} ${user._id === item._id ? s.Active : ''}`}
      >
        {item.name || item.email}
      </List.Item>
     )}
   />*/}

      <div className={s.About}>
        <Button
          className={s.AddButton}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        />

        <ModalWindow
          title={`Add new domain`}
          isModalVisible={isModalVisible}
          onCancel={onCancelModal}
          onOk={onSubmitModal}
          okText="Create domain"
          cancelText="Cancel"
        >
          <AddDomainModal
            isFormDisabled={isFormDisabled}
            form={form}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
          />
        </ModalWindow>
      </div>
    </div>
  )
}

export default AdminPageDomains
