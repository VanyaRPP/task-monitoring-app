import { useState, useEffect } from 'react'
import { Form, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ModalWindow from '../../UI/ModalWindow'
import AddDomainModal from '../../Forms/AddDomainForm'
import s from './style.module.scss'

const AdminPageDomains: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  const [form] = Form.useForm()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmiModal = async () => {
    // const formData: ICategory = await form.validateFields()
    setIsFormDisabled(true)
    // await addCategory({ ...formData })
    // console.log(form.getFieldsValue());

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
          onOk={onSubmiModal}
          okText="Create domain"
          cancelText="Cancel"
        >
          <AddDomainModal isFormDisabled={isFormDisabled} form={form} />
        </ModalWindow>
      </div>
    </div>
  )
}

export default AdminPageDomains
