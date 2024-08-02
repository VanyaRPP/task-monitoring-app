import { PlusOutlined } from '@ant-design/icons'
import { deleteExtraWhitespace } from '@assets/features/validators'
import {
  useAddCategoryMutation,
  useEditCategoryMutation,
} from '@common/api/categoriesApi/category.api'
import Modal from '@components/UI/ModalWindow'
import useDebounce from '@modules/hooks/useDebounce'
import { ICategory } from '@modules/models/Category'
import { Button, Form, Input } from 'antd'
import { useCallback, useState } from 'react'
import Categories from '../../Categories'
import AddCategoryForm from '../../Forms/AddCategoryForm'
import s from './style.module.scss'

const AdminPageCategories: React.FC = () => {
  const { Search } = Input

  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)

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
        <Modal
          title={!id ? 'Додати категорію' : 'Змінити категорію'}
          open={isModalVisible}
          onCancel={onCancelModal}
          changed={() => isValueChanged}
          onOk={!id ? onSubmitModal : onSubmitEditModal}
          okText={!id ? 'Додати' : 'Змінити'}
          cancelText="Скасувати"
        >
          <AddCategoryForm
            isFormDisabled={isFormDisabled}
            form={form}
            id={id}
            setIsValueChanged={setIsValueChanged}
          />
        </Modal>
      </div>
      <Categories nameFilter={debounced} handleEdit={handleEdit} />
    </>
  )
}

export default AdminPageCategories
