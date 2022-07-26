import { useCallback, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input } from 'antd'
import {
  useAddCategoryMutation,
  useEditCategoryMutation,
} from 'common/api/categoriesApi/category.api'
import { ICategory } from 'common/modules/models/Category'
import AddCategoryForm from '../../Forms/AddCategoryForm'
import Categories from '../../Categories'
import ModalWindow from '../../UI/ModalWindow'
import s from './style.module.scss'
import useDebounce from '../../../modules/hooks/useDebounce'
import { deleteExtraWhitespace } from '../../../assets/features/validators'

const AdminPageCategories: React.FC = () => {
  const { Search } = Input

  const [form] = Form.useForm()

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const [id, setId] = useState<string>(null)

  const [addCategory] = useAddCategoryMutation()
  const [editCategory] = useEditCategoryMutation()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmitModal = async () => {
    const formData: ICategory = await form.validateFields()
    setIsFormDisabled(true)
    await addCategory({ ...formData })
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  const onSubmitEditModal = async () => {
    const formData: ICategory = await form.validateFields()
    setIsFormDisabled(true)
    editCategory({ _id: id, ...formData })
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  const handleEdit = useCallback((value) => {
    setId(value)
    setIsModalVisible(true)
  }, [])

  const [search, setSearch] = useState('')
  const debounced = useDebounce<string>(search)

  return (
    <>
      <div className={s.Controls}>
        <Input
          placeholder="Пошук категорії..."
          value={search}
          onChange={(e) => setSearch(deleteExtraWhitespace(e.target.value))}
        />
        <Button
          className={s.AddButton}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        />
        <ModalWindow
          title={!id ? 'Додати категорію' : 'Змінити категорію'}
          isModalVisible={isModalVisible}
          onCancel={onCancelModal}
          onOk={!id ? onSubmitModal : onSubmitEditModal}
          okText={!id ? 'Додати' : 'Змінити'}
          cancelText="Скасувати"
        >
          <AddCategoryForm
            isFormDisabled={isFormDisabled}
            form={form}
            id={id}
          />
        </ModalWindow>
      </div>

      <Categories nameFilter={debounced} handleEdit={handleEdit} />
    </>
  )
}

export default AdminPageCategories
