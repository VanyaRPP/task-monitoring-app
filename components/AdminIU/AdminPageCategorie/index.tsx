import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input } from 'antd'
import { useState } from 'react'
import { useAddCategoryMutation } from '../../../api/categoriesApi/category.api'
import { ICategory } from '../../../models/Category'
import AddCategoryForm from '../../AddCategoryForm'
import Categories from '../../Categories'
import ModalWindow from '../../UI/ModalWindow'
import s from './style.module.scss'

const AdminPageCategories: React.FC = () => {
  const { Search } = Input

  const [form] = Form.useForm()

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  const [addCategory] = useAddCategoryMutation()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmiModal = async () => {
    const formData: ICategory = await form.validateFields()
    setIsFormDisabled(true)
    await addCategory({ ...formData })
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }
  return (
    <>
      <div className={s.Controls}>
        <Search
          className={s.Search}
          placeholder="input search text"
          onSearch={() => console.log('search')}
          enterButton
        />
        <Button
          className={s.AddButton}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        />
        <ModalWindow
          isModalVisible={isModalVisible}
          onCancel={onCancelModal}
          onOk={onSubmiModal}
          okText="Create category"
          cancelText="Cancel"
        >
          <AddCategoryForm isFormDisabled={isFormDisabled} form={form} />
        </ModalWindow>
      </div>
      <Categories />
    </>
  )
}

export default AdminPageCategories
